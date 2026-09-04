import "./load-env";
import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";
import JSZip from "jszip";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../src/db/client";
import { exerciseOverrides, sourceExercises } from "../src/db/schema";

/**
 * L5: backfill real tips for the exercises the fresh site extract's own
 * parser never captured. The extract (data/source/muscle_strength_
 * exercise_library_complete_master.xlsx) has an empty Tips column for 67
 * exercises; scripts/curate-exercises.ts only ever scraped instructions/
 * starting_position, never tips, so those 67 have sat on the generic
 * movement-pattern fallback from populate-tips-and-mistakes.ts since Epic L.
 * 2 of the 67 (Exercise Ball Cable Fly, One-Arm Standing Dumbbell Extension)
 * already got real content from an earlier manual Overview/Instructions
 * swap — detected here by their override no longer matching a known
 * fallback string, not hardcoded, so this script stays correct if re-run
 * after more manual fixes land.
 *
 * The site itself sometimes really has no tips section (confirmed by
 * spot-checking live pages before writing this) — those are left on their
 * existing fallback text rather than fabricated or blanked.
 */

const EXTRACT_PATH = path.join(process.cwd(), "data/source/muscle_strength_exercise_library_complete_master.xlsx");
const CACHE_DIR = path.join(process.cwd(), ".curate-tips-cache");
const DELAY_MS = 1000;
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

// The exact fallback strings populate-tips-and-mistakes.ts writes, keyed by
// movement pattern. An exercise still holding one of these has never had its
// tips corrected against real site content — duplicated here rather than
// imported, since that script runs a full population pass as a module-level
// side effect and isn't safe to import.
const GENERIC_TIPS_FALLBACKS = new Set([
  "Retract shoulder blades into the surface throughout the movement. Grip slightly wider than shoulder-width. Drive feet into the floor for leg drive. Achieve full lockout without hyperextending the elbows.",
  "Press straight overhead or slightly forward over your center of mass. Maintain core and glute tension throughout. Achieve full lockout with aligned shoulders. Descend to shoulders or upper chest before the next rep.",
  "Drive elbows back past your torso, not out to the sides. Initiate with back muscles, not arm strength. Squeeze shoulder blades together at the peak. Hinge from the hips, maintaining a neutral spine.",
  "Start with full arm extension. Pull elbows down and back, leading with the chest. Achieve full scapular depression at the bottom. Control the descent fully without dropping.",
  "Keep your chest up and weight distributed evenly across the forefoot. Knees track over your toes throughout. Descend to below parallel if mobility allows. Drive through your heels to stand, maintaining spinal alignment.",
  "Keep the bar close to your body throughout the movement. Maintain a neutral spine by bracing your core. Drive through your entire foot, initiating the movement with your hips and legs. Extend completely at the top without overextending the lower back.",
  "Stand tall with a neutral spine. Shoulders packed and core braced. Carry at a controlled pace for distance or time. Avoid leaning to one side; maintain even loading if unilateral.",
  "Rotate from your core, not your arms or shoulders. Move deliberately and controlled throughout the range. Maintain a tall posture with minimal spinal flexion. Achieve full rotation on both sides if alternating.",
  "Lock elbows in place at your sides or above. Press from the elbow joint only. Achieve full lockout at the top. Control the descent to maintain tension throughout the range.",
  "Keep elbows at your sides or slightly in front, avoiding excessive movement. Curl through the full range of motion under control. Achieve a full contraction at the top. Control the descent to maintain tension.",
  "Lead with the elbows, not the hands. Maintain a slight bend in your elbows throughout. Raise to shoulder height or slightly above. Control the lowering phase to maintain tension.",
  "Curl your heels toward your glutes through your full range of motion. Achieve full contraction at the top. Control the eccentric portion. Move slowly without bouncing.",
  "Extend knees fully at the top without hyperextending. Move slowly through the full range. Control the descent. Maintain tension throughout, avoiding complete lock-out loss.",
  "Maintain a slight bend in your elbows throughout the movement. Feel the stretch at the bottom. Drive the movement with your chest muscles. Squeeze at the top position.",
  "Crunch from the rib cage toward the pelvis, not from the neck. Keep your neck neutral throughout. Move slowly and deliberately. Achieve full contraction at the top.",
  "Land softly with bent knees to absorb force. Stick landings and demonstrate control. Use a box height you can land safely on. Pause between reps to reset.",
  "Use slow, deliberate movements over the muscle group. Apply comfortable pressure without causing sharp pain. Pause on tender points for 15-30 seconds. Breathe steadily throughout.",
  "Focus on movement quality and muscle activation over load. Use controlled movements without jerking. Gradually increase intensity. Emphasize full range of motion and muscle connection.",
  "Move deliberately and under control throughout the entire range of motion. Prioritize form and muscle engagement over load. Maintain consistent breathing and body tension.",
]);

interface ExtractRow {
  id: string;
  name: string;
  url: string;
  tips: string;
}

interface Target {
  exerciseId: string;
  name: string;
  url: string;
}

type ExtractResult =
  | { status: "found"; text: string }
  | { status: "not_on_site" }
  | { status: "parse_failed" };

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/​/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ""));
}

/** Reads the fresh extract's "Exercise Library" sheet directly from the
 * xlsx zip's XML. exceljs 4.4.0 cannot parse this file — its workbook.xml
 * and sheetN.xml use a namespace-prefixed root element (<x:worksheet
 * xmlns:x="...">) that exceljs's SAX parser doesn't recognise, confirmed by
 * inspecting the unzipped XML directly. All cells in this file use inline
 * strings (t="str"), so no shared-strings lookup is needed. */
async function readExtractRows(): Promise<ExtractRow[]> {
  const buffer = fs.readFileSync(EXTRACT_PATH);
  const zip = await JSZip.loadAsync(buffer);
  const sheetFile = zip.file("xl/worksheets/sheet1.xml");
  if (!sheetFile) throw new Error("xl/worksheets/sheet1.xml not found in extract");
  const xml = await sheetFile.async("string");

  const rows: ExtractRow[] = [];
  const rowRe = /<x:row r="(\d+)"[^>]*>([\s\S]*?)<\/x:row>/g;
  const cellRe = /<x:c r="([A-Z]+)\d+"[^>]*?(?:\/>|>([\s\S]*?)<\/x:c>)/g;

  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(xml)) !== null) {
    const rowNum = parseInt(rowMatch[1], 10);
    if (rowNum === 1) continue; // header

    const cells: Record<string, string> = {};
    let cellMatch: RegExpExecArray | null;
    cellRe.lastIndex = 0;
    while ((cellMatch = cellRe.exec(rowMatch[2])) !== null) {
      const inner = cellMatch[2];
      const vMatch = inner ? inner.match(/<x:v>([\s\S]*?)<\/x:v>/) : null;
      cells[cellMatch[1]] = vMatch ? decodeEntities(vMatch[1]) : "";
    }

    rows.push({ id: cells.A ?? "", name: cells.B ?? "", url: cells.J ?? "", tips: cells.M ?? "" });
  }

  return rows;
}

function urlSlug(url: string): string {
  const last = url.split("/").filter(Boolean).pop() ?? "";
  return last.replace(/\.html?$/i, "").toLowerCase();
}

/** Recomputes the target list from current data every run rather than a
 * hardcoded id list: extract rows with no Tips value, matched to
 * source_exercises by canonical URL, kept only where the exercise's current
 * global tips override is still a known generic fallback (i.e. not already
 * hand-corrected). */
async function resolveTargets(): Promise<Target[]> {
  const extractRows = await readExtractRows();
  const noTipsInExtract = extractRows.filter((r) => !r.tips.trim());

  const allExercises = await db
    .select({ exerciseId: sourceExercises.exerciseId, name: sourceExercises.name, url: sourceExercises.url })
    .from(sourceExercises);
  const bySlug = new Map(allExercises.filter((e) => e.url).map((e) => [urlSlug(e.url!), e]));

  const candidateIds: string[] = [];
  const candidateByUrl = new Map<string, { exerciseId: string; name: string; url: string }>();
  for (const row of noTipsInExtract) {
    const match = bySlug.get(urlSlug(row.url));
    if (!match || !match.url) continue;
    candidateIds.push(match.exerciseId);
    candidateByUrl.set(match.exerciseId, { exerciseId: match.exerciseId, name: match.name, url: match.url });
  }

  const overrides = await db
    .select()
    .from(exerciseOverrides)
    .where(and(inArray(exerciseOverrides.exerciseId, candidateIds), eq(exerciseOverrides.field, "tips"), isNull(exerciseOverrides.profileId)));
  const overrideValueByExercise = new Map(overrides.map((o) => [o.exerciseId, o.value]));

  const targets: Target[] = [];
  for (const id of candidateIds) {
    const currentValue = overrideValueByExercise.get(id);
    if (currentValue !== undefined && !GENERIC_TIPS_FALLBACKS.has(currentValue)) continue; // already hand-corrected
    const c = candidateByUrl.get(id)!;
    targets.push(c);
  }
  return targets;
}

function getCacheFile(exerciseId: string): string {
  return path.join(CACHE_DIR, `${exerciseId}.html`);
}

function fetchHtml(url: string, exerciseId: string): string {
  const cacheFile = getCacheFile(exerciseId);
  if (fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile, "utf-8");
  }
  // Node's fetch() gets a 403 Cloudflare challenge from this site
  // (confirmed directly, same User-Agent); plain curl does not — the block
  // fingerprints the TLS/HTTP client, not the request headers.
  console.log(`Fetching ${exerciseId} via curl: ${url}`);
  const html = execFileSync("curl", ["-s", "-A", USER_AGENT, url], { encoding: "utf-8", maxBuffer: 20 * 1024 * 1024 });
  fs.writeFileSync(cacheFile, html);
  return html;
}

/** Finds a heading (h2-h4) whose text ends in "Tips" or "Tips:" — the site
 * labels this per-exercise ("Side Bend Tips:", "Exercise Tips:", etc.), not
 * with one fixed string — then captures block-level content (<li> or <p>)
 * until the next heading or a "Common mistakes" block, whichever is first.
 * Some pages (e.g. Hanging Knee Raise, confirmed live) genuinely have no
 * tips section at all; that's reported as not_on_site, not an error. */
function extractTips(html: string): ExtractResult {
  const headingRe = /<h[2-4][^>]*>((?:(?!<\/h[2-4]>)[\s\S])*?Tips:?\s*)<\/h[2-4]>/i;
  const headingMatch = html.match(headingRe);
  if (!headingMatch || headingMatch.index === undefined) {
    return { status: "not_on_site" };
  }

  const afterHeading = html.slice(headingMatch.index + headingMatch[0].length);
  const nextHeadingIdx = afterHeading.search(/<h[2-4][^>]*>/i);
  // </article> is a hard stop: past it is page furniture (share buttons,
  // newsletter signup CTA — "Join over 500k subscribers...", found live on
  // every page) that isn't part of the exercise content at all.
  const articleEndIdx = afterHeading.search(/<\/article/i);
  const candidates = [nextHeadingIdx, articleEndIdx].filter((i) => i !== -1);
  const section = candidates.length === 0 ? afterHeading : afterHeading.slice(0, Math.min(...candidates));

  // Walk top-level <li> and <p> blocks in document order, stopping at the
  // first one whose text starts with "Common mistakes" (with or without its
  // own heading tag — the squat-family pages fold it into a plain <p><strong>).
  // Tag-name boundary matters here: an unqualified <p[^>]*> also matches
  // <path ...> (SVG icon markup from the page's AddThis share widget), and
  // <li[^>]*> also matches <link ...> — both found live, pulling share-button
  // SVG garbage into the captured tips text before this was tightened.
  const blockRe = /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>|<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi;
  const lines: string[] = [];
  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = blockRe.exec(section)) !== null) {
    const raw = blockMatch[1] ?? blockMatch[2] ?? "";
    const text = stripTags(raw);
    if (!text) continue;
    if (/^common mistakes/i.test(text)) break;
    lines.push(text);
  }

  if (lines.length === 0) return { status: "parse_failed" };
  return { status: "found", text: lines.join("\n") };
}

interface ReportEntry {
  exerciseId: string;
  name: string;
  url: string;
  status: ExtractResult["status"];
  text?: string;
}

async function main() {
  const write = process.argv.includes("--write");

  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

  const targets = await resolveTargets();
  console.log(`${targets.length} exercises still on generic tips with no tips in the fresh extract\n`);

  const report: ReportEntry[] = [];
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const cached = fs.existsSync(getCacheFile(t.exerciseId));
    const html = fetchHtml(t.url, t.exerciseId);
    const result = extractTips(html);

    if (result.status === "found") {
      report.push({ exerciseId: t.exerciseId, name: t.name, url: t.url, status: "found", text: result.text });
      console.log(`✓ ${t.exerciseId} (${t.name}): found — "${result.text.slice(0, 80)}${result.text.length > 80 ? "…" : ""}"`);
    } else if (result.status === "not_on_site") {
      report.push({ exerciseId: t.exerciseId, name: t.name, url: t.url, status: "not_on_site" });
      console.log(`- ${t.exerciseId} (${t.name}): no tips section on the site`);
    } else {
      report.push({ exerciseId: t.exerciseId, name: t.name, url: t.url, status: "parse_failed" });
      console.log(`? ${t.exerciseId} (${t.name}): tips heading found but content didn't parse — needs manual review`);
    }

    if (!cached && i < targets.length - 1) await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  const found = report.filter((r) => r.status === "found");
  const notOnSite = report.filter((r) => r.status === "not_on_site");
  const parseFailed = report.filter((r) => r.status === "parse_failed");

  console.log(`\n${found.length} found, ${notOnSite.length} genuinely absent on site, ${parseFailed.length} parse failures`);

  const reportPath = path.join(process.cwd(), ".curate-tips-cache", "report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report written to ${reportPath}`);

  if (!write) {
    console.log("\nDry run only — no database writes. Re-run with --write to apply.");
    process.exit(0);
  }

  console.log(`\nWriting ${found.length} corrected tips to exercise_overrides...`);
  let updated = 0;
  for (const r of found) {
    const result = await db
      .update(exerciseOverrides)
      .set({ value: r.text!, updatedAt: new Date() })
      .where(and(eq(exerciseOverrides.exerciseId, r.exerciseId), eq(exerciseOverrides.field, "tips"), isNull(exerciseOverrides.profileId)))
      .returning({ id: exerciseOverrides.id });
    if (result.length === 0) {
      console.log(`⚠️  ${r.exerciseId}: no existing global tips override row to update — skipped`);
      continue;
    }
    updated++;
  }
  console.log(`\n✅ Updated ${updated} exercise tips`);

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
