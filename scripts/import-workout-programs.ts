import "./load-env";
import * as fs from "fs";
import * as path from "path";
import { JSDOM } from "jsdom";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "../src/db/client";
import {
  sourceExercises,
  sourceWorkoutProgramDays,
  sourceWorkoutProgramExercises,
  sourceWorkoutPrograms,
} from "../src/db/schema";

/**
 * Imports packaged multi-day workout programs from muscleandstrength.com —
 * Epic Q. Source layer only (see src/db/schema/source.ts's doc comment):
 * rebuilt on re-run, never touched by a profile's own saved workouts.
 *
 * Reuses the existing exercise corpus rather than re-scraping exercise
 * content: every exercise link on a program page points at
 * muscleandstrength.com/exercises/<slug>[.html], the exact URL scheme
 * source_exercises.url already holds from the original spreadsheet import
 * (confirmed by direct comparison, not assumed) — so exercises are matched
 * by slug, never duplicated.
 *
 * Same conventions as curate-exercises.ts: local cache, 1 req/sec, a
 * source_row_hash for idempotent re-runs. Real page structure varies more
 * than the exercise pages did (see the per-page notes below), found by
 * fetching and reading four structurally different real programs before
 * writing this, not guessed from one example.
 */

const CACHE_DIR = path.join(process.cwd(), ".workout-program-cache");
const DELAY_MS = 1000;
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

function slugFromUrl(url: string): string {
  return url
    .split("?")[0]
    .replace(/\/$/, "")
    .split("/")
    .pop()!
    .replace(/\.html$/i, "")
    .toLowerCase();
}

function cacheFile(programSlug: string): string {
  return path.join(CACHE_DIR, `${programSlug}.html`);
}

async function fetchHtml(url: string): Promise<string> {
  const slug = slugFromUrl(url);
  const cached = cacheFile(slug);
  if (fs.existsSync(cached)) {
    return fs.readFileSync(cached, "utf-8");
  }
  console.log(`Fetching ${url}...`);
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  fs.writeFileSync(cached, html);
  await new Promise((r) => setTimeout(r, DELAY_MS));
  return html;
}

/** Metadata lives in .node-stats-block li elements: a .row-label span
 * naming the field, followed by either a nested .field-item value or (for
 * a few fields, observed directly on the page) plain text in the <li>
 * itself. Reading "everything except the label" covers both shapes. */
function extractMetadata(doc: Document): Record<string, string> {
  const out: Record<string, string> = {};
  const items = doc.querySelectorAll(".node-stats-block li");
  for (const li of items) {
    const label = li.querySelector(".row-label")?.textContent?.trim();
    if (!label) continue;
    const clone = li.cloneNode(true) as Element;
    clone.querySelector(".row-label")?.remove();
    const value = clone.textContent?.replace(/\s+/g, " ").trim();
    if (value) out[label] = value;
  }
  return out;
}

function extractDescription(html: string): string | null {
  // The page's own JSON-LD Article block carries a one-line summary —
  // cleaner than trying to isolate a description paragraph from free-form
  // prose, and it's the site's own stated summary, not our excerpt of it.
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    return typeof data.description === "string" ? data.description : null;
  } catch {
    return null;
  }
}

const WEEKDAY_TO_NUMBER: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

interface ParsedExercise {
  position: number;
  exerciseUrlRaw: string | null;
  exerciseNameRaw: string;
  sets: string | null;
  reps: string | null;
  rest: string | null;
  notes: string | null;
}

interface ParsedDay {
  dayNumber: number;
  isRestDay: boolean;
  focus: string | null;
  exercises: ParsedExercise[];
}

/**
 * Two independent day sources exist across real pages and neither is
 * present on every page, so both are tried:
 *
 *  - An explicit "Day N - <link> and <link>" / "Day N - OFF" summary list
 *    (seen on "4 Day Maximum Mass"), which is the only reliable source of
 *    explicit rest days — rest days are never fabricated when this list is
 *    absent, only recorded when the source states them.
 *  - <h4>/<table> pairs for the actual per-day exercise tables, which is
 *    the only universal source (every program has these) but sometimes
 *    labels days by weekday name ("Monday: Upper Body Workout") rather
 *    than "Day N". Weekday names map to a 1-7 slot; anything else falls
 *    back to a sequential counter among the tables found, rather than
 *    guessing a number the source never stated.
 */
function extractDays(doc: Document): ParsedDay[] {
  const restDayNumbers = new Set<number>();
  for (const li of doc.querySelectorAll("li")) {
    const strong = li.querySelector("strong");
    const dayMatch = strong?.textContent?.match(/Day\s*(\d+)/i);
    if (!dayMatch) continue;
    const rest = li.textContent?.replace(strong!.textContent ?? "", "").trim();
    if (rest && /^-?\s*OFF\b/i.test(rest)) {
      restDayNumbers.add(Number(dayMatch[1]));
    }
  }

  const days: ParsedDay[] = [];
  let sequential = 0;
  // <h4>Day N - Focus</h4> and <h3>Workout N: Focus Day</h3> both appear
  // across real pages ("3 Day PPL for Beginners" uses h3 + "Workout N",
  // unlike the other three programs checked) — both heading levels are
  // tried, not just one.
  const headings = [...doc.querySelectorAll("h3, h4")];

  for (const heading of headings) {
    const table = heading.nextElementSibling;
    if (!table || table.tagName !== "TABLE") continue;

    const text = heading.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const explicitDay = text.match(/(?:Day|Workout)\s*(\d+)/i);
    const weekdayMatch = text.match(
      /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i,
    );
    // Strip the leading "Day N -", "Workout N:" or "Monday:" label so the
    // page (which already renders "Day {dayNumber} — {focus}") doesn't show
    // it twice, e.g. "Day 1 - Back & Biceps" -> focus "Back & Biceps".
    const focusText =
      text
        .replace(
          /^(?:(?:Day|Workout)\s*\d+|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*[-:]\s*/i,
          "",
        )
        .trim() || null;

    sequential += 1;
    const dayNumber = explicitDay
      ? Number(explicitDay[1])
      : weekdayMatch
        ? WEEKDAY_TO_NUMBER[weekdayMatch[1].toLowerCase()]
        : sequential;

    const exercises: ParsedExercise[] = [];
    let position = 0;
    const headerCells = [...table.querySelectorAll("tr:first-child th")].map((th) =>
      th.textContent?.trim().toLowerCase(),
    );
    const restColIndex = headerCells.findIndex((h) => h === "rest");

    for (const row of table.querySelectorAll("tbody tr, tr")) {
      if (row.querySelector("th")) continue; // header row
      const cells = [...row.querySelectorAll("td")];
      if (cells.length === 0) continue;

      const link = cells[0].querySelector("a");
      const linkText = link?.textContent?.trim() ?? "";
      const fullCellText = cells[0].textContent?.replace(/\s+/g, " ").trim() ?? "";
      const notes =
        linkText && fullCellText.startsWith(linkText)
          ? fullCellText.slice(linkText.length).replace(/^[\s-]+/, "").trim() || null
          : null;

      position += 1;
      exercises.push({
        position,
        exerciseUrlRaw: link ? new URL(link.getAttribute("href")!, "https://www.muscleandstrength.com").href : null,
        exerciseNameRaw: linkText || fullCellText,
        sets: cells[1]?.textContent?.replace(/\s+/g, " ").trim() || null,
        reps: cells[2]?.textContent?.replace(/\s+/g, " ").trim() || null,
        rest: restColIndex >= 0 ? cells[restColIndex]?.textContent?.replace(/\s+/g, " ").trim() || null : null,
        notes,
      });
    }

    days.push({ dayNumber, isRestDay: false, focus: focusText, exercises });
  }

  for (const n of restDayNumbers) {
    if (!days.some((d) => d.dayNumber === n)) {
      days.push({ dayNumber: n, isRestDay: true, focus: null, exercises: [] });
    }
  }

  return days.sort((a, b) => a.dayNumber - b.dayNumber);
}

function parseIntOrNull(s: string | undefined): number | null {
  if (!s) return null;
  const match = s.match(/\d+/);
  return match ? Number(match[0]) : null;
}

async function loadExerciseUrlIndex(): Promise<Map<string, string>> {
  const rows = await db.select({ exerciseId: sourceExercises.exerciseId, url: sourceExercises.url }).from(sourceExercises);
  const index = new Map<string, string>();
  for (const r of rows) {
    if (r.url) index.set(slugFromUrl(r.url), r.exerciseId);
  }
  return index;
}

async function importProgram(url: string, programId: string, exerciseIndex: Map<string, string>) {
  const html = await fetchHtml(url);
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const meta = extractMetadata(doc);
  const name = doc.querySelector("h1")?.textContent?.trim() || meta["Name"] || slugFromUrl(url);
  const description = extractDescription(html);
  const days = extractDays(doc);

  const totalExercises = days.reduce((n, d) => n + d.exercises.length, 0);
  const matched = days.reduce(
    (n, d) => n + d.exercises.filter((e) => e.exerciseUrlRaw && exerciseIndex.has(slugFromUrl(e.exerciseUrlRaw))).length,
    0,
  );

  const sourceRowHash = crypto.createHash("sha256").update(html).digest("hex");

  await db.transaction(async (tx) => {
    await tx
      .insert(sourceWorkoutPrograms)
      .values({
        programId,
        name,
        url,
        description,
        mainGoal: meta["Main Goal"] ?? null,
        workoutType: meta["Workout Type"] ?? null,
        trainingLevel: meta["Training Level"] ?? null,
        durationWeeks: parseIntOrNull(meta["Program Duration"]),
        daysPerWeek: parseIntOrNull(meta["Days Per Week"]),
        timePerWorkout: meta["Time Per Workout"] ?? null,
        equipmentNeeded: meta["Equipment Required"] ?? null,
        targetGender: meta["Target Gender"] ?? null,
        sourceRowHash,
      })
      .onConflictDoUpdate({
        target: sourceWorkoutPrograms.programId,
        set: {
          name,
          description,
          mainGoal: meta["Main Goal"] ?? null,
          workoutType: meta["Workout Type"] ?? null,
          trainingLevel: meta["Training Level"] ?? null,
          durationWeeks: parseIntOrNull(meta["Program Duration"]),
          daysPerWeek: parseIntOrNull(meta["Days Per Week"]),
          timePerWorkout: meta["Time Per Workout"] ?? null,
          equipmentNeeded: meta["Equipment Required"] ?? null,
          targetGender: meta["Target Gender"] ?? null,
          sourceRowHash,
        },
      });

    // Re-importable: clear this program's days (cascades to its exercises)
    // and re-insert, rather than trying to diff — matches the "rebuilt on
    // every run" posture of the rest of the source layer.
    await tx.delete(sourceWorkoutProgramDays).where(eq(sourceWorkoutProgramDays.programId, programId));

    for (const day of days) {
      const [dayRow] = await tx
        .insert(sourceWorkoutProgramDays)
        .values({
          programId,
          dayNumber: day.dayNumber,
          isRestDay: day.isRestDay,
          focus: day.focus,
        })
        .returning({ id: sourceWorkoutProgramDays.id });

      for (const ex of day.exercises) {
        const matchedExerciseId = ex.exerciseUrlRaw
          ? exerciseIndex.get(slugFromUrl(ex.exerciseUrlRaw)) ?? null
          : null;
        await tx.insert(sourceWorkoutProgramExercises).values({
          programDayId: dayRow.id,
          position: ex.position,
          exerciseId: matchedExerciseId,
          exerciseNameRaw: ex.exerciseNameRaw,
          exerciseUrlRaw: ex.exerciseUrlRaw,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          notes: ex.notes,
        });
      }
    }
  });

  const trainingDays = days.filter((d) => !d.isRestDay).length;
  console.log(
    `${programId} ${name}: ${trainingDays} training day(s), ${totalExercises} exercise row(s), ` +
      `${matched}/${totalExercises} matched to an existing exercise`,
  );
  if (matched < totalExercises) {
    const unmatched = days
      .flatMap((d) => d.exercises)
      .filter((e) => e.exerciseUrlRaw && !exerciseIndex.has(slugFromUrl(e.exerciseUrlRaw)));
    for (const u of unmatched.slice(0, 10)) {
      console.log(`  UNMATCHED: "${u.exerciseNameRaw}" -> ${u.exerciseUrlRaw}`);
    }
  }
}

const PROGRAMS: { id: string; url: string }[] = [
  { id: "WP-0001", url: "https://muscleandstrength.com/workouts/4-day-maximum-mass-workout" },
  { id: "WP-0002", url: "https://muscleandstrength.com/workouts/upper-lower-4-day-gym-bodybuilding-workout" },
  { id: "WP-0003", url: "https://muscleandstrength.com/workouts/3-day-PPL-workout-for-beginners" },
  { id: "WP-0004", url: "https://muscleandstrength.com/workouts/12-week-fat-destroyer" },
];

async function main() {
  const exerciseIndex = await loadExerciseUrlIndex();
  console.log(`Loaded ${exerciseIndex.size} existing exercise URLs for matching.\n`);

  for (const p of PROGRAMS) {
    await importProgram(p.url, p.id, exerciseIndex);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
