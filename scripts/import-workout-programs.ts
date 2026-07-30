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
  // <h4>Day N - Focus</h4>, <h3>Workout N: Focus Day</h3> and
  // <h2>Workout N: Focus</h2> all appear across real pages ("3 Day PPL for
  // Beginners" uses h3 + "Workout N"; "8 Week Mass Building Hypertrophy
  // Workout" uses h2 + "Workout N") — all three heading levels are tried.
  const headings = [...doc.querySelectorAll("h2, h3, h4")];

  for (const heading of headings) {
    // The table isn't always the heading's immediate next sibling — some
    // pages (e.g. bodyweight/EMOM programs) put a one-line description
    // paragraph in between. Look ahead a few siblings, but stop at the next
    // heading so a day with no table of its own doesn't pick up a later
    // day's table.
    let table: Element | null = null;
    let sibling = heading.nextElementSibling;
    for (let hops = 0; sibling && hops < 4; hops += 1) {
      if (["H2", "H3", "H4"].includes(sibling.tagName)) break;
      if (sibling.tagName === "TABLE") {
        table = sibling;
        break;
      }
      sibling = sibling.nextElementSibling;
    }
    if (!table) continue;
    // Looking ahead past intervening elements risks landing on an unrelated
    // table under a generic section heading (e.g. "The Workouts" followed by
    // an intro paragraph and then a weight-progression chart, not a day's
    // exercises — seen on the real site). Only accept a table that actually
    // looks like an exercise table: every one seen across all pages checked
    // has an "Exercise" column header.
    const candidateHeaderCells = [...table.querySelectorAll("tr:first-child th")].map((th) =>
      th.textContent?.trim().toLowerCase(),
    );
    if (!candidateHeaderCells.some((h) => h === "exercise")) continue;

    const text = heading.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const explicitDay = text.match(/(?:Day|Workout)\s*#?\s*(\d+)/i);
    const weekdayMatch = text.match(
      /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i,
    );
    // Strip the leading "Day N -", "Workout N:" or "Monday:" label so the
    // page (which already renders "Day {dayNumber} — {focus}") doesn't show
    // it twice, e.g. "Day 1 - Back & Biceps" -> focus "Back & Biceps".
    const focusText =
      text
        .replace(
          /^(?:(?:Day|Workout)\s*#?\s*\d+|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*[-:]\s*/i,
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
    const headerCells = candidateHeaderCells;
    // Column position isn't reliable across page variants — some tables
    // (e.g. EMOM/circuit-style pages) have no Sets column at all, just
    // Exercise/Reps/Rest. Read by header label where a header row exists;
    // only fall back to the historical fixed positions (1=sets, 2=reps) for
    // the rare table with no <th> row to read labels from at all, so a
    // genuinely absent column reads as null instead of another column's data.
    const hasHeaderRow = headerCells.length > 0;
    const setsColIndex = headerCells.findIndex((h) => h === "sets");
    const repsColIndex = headerCells.findIndex((h) => h === "reps");
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
        sets:
          (hasHeaderRow ? setsColIndex : 1) >= 0
            ? cells[hasHeaderRow ? setsColIndex : 1]?.textContent?.replace(/\s+/g, " ").trim() || null
            : null,
        reps:
          (hasHeaderRow ? repsColIndex : 2) >= 0
            ? cells[hasHeaderRow ? repsColIndex : 2]?.textContent?.replace(/\s+/g, " ").trim() || null
            : null,
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

function categorizeProgram(name: string, meta: Record<string, string>): string {
  const lower = name.toLowerCase();
  const goal = (meta["Main Goal"] ?? "").toLowerCase();
  const gender = (meta["Target Gender"] ?? "").toLowerCase();
  const equipment = (meta["Equipment Required"] ?? "").toLowerCase();
  const isWomenOnly = gender === "female" || (lower.includes("women") && (lower.includes("for women") || lower.includes("women's")));

  // Check for equipment-specific programs first (high priority)
  if (lower.includes("dumbbell") && lower.includes("only")) return "Dumbbell Only";
  if (lower.includes("kettlebell")) return "Kettlebell";
  if (lower.includes("bodyweight") || lower.includes("no equipment")) return "Bodyweight";
  if ((lower.includes("home") || lower.includes("at home")) && !isWomenOnly) return "Home Workouts";
  if (lower.includes("planet fitness")) return "Gym - Limited Equipment";

  // Check for specialty programs
  if (lower.includes("deload")) return "Recovery & Deload";
  if (lower.includes("abs") || lower.includes("core")) return "Specialty - Core";
  if (lower.includes("squat")) return "Specialty - Squat Focus";
  if (lower.includes("deadlift")) return "Specialty - Deadlift Focus";
  if (lower.includes("bench")) return "Specialty - Bench Press Focus";
  if (lower.includes("hiit") || lower.includes("cardio")) return "Cardio & HIIT";
  if (lower.includes("finisher")) return "Finisher Programs";

  // Check for strength and hypertrophy
  if (goal.includes("strength") || lower.includes("strength")) {
    if (isWomenOnly) return "Strength Training - Women";
    return "Strength Training";
  }
  if (goal.includes("hypertrophy") || lower.includes("hypertrophy") || lower.includes("mass")) {
    if (isWomenOnly) return "Muscle Building - Women";
    return "Muscle Building";
  }
  if (goal.includes("fat") || lower.includes("fat loss") || lower.includes("shred")) {
    if (isWomenOnly) return "Fat Loss - Women";
    return "Fat Loss";
  }

  // Check for split types
  if (lower.includes("full body")) {
    if (isWomenOnly) return "Full Body - Women";
    return "Full Body";
  }
  if (lower.includes("upper") && lower.includes("lower")) return "Upper/Lower Split";
  if (lower.includes("push pull leg") || lower.includes("ppl")) return "Push/Pull/Legs Split";
  if (lower.includes("bro split")) return "Muscle Building";

  // Default based on main goal
  if (goal.includes("fat")) {
    if (isWomenOnly) return "Fat Loss - Women";
    return "Fat Loss";
  }
  if (goal.includes("strength")) {
    if (isWomenOnly) return "Strength Training - Women";
    return "Strength Training";
  }
  if (goal.includes("muscle") || goal.includes("build")) {
    if (isWomenOnly) return "Muscle Building - Women";
    return "Muscle Building";
  }

  // Catch-all
  return "Mixed Programs";
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
  const category = categorizeProgram(name, meta);
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
        category,
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
          category,
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
  { id: "WP-0005", url: "https://muscleandstrength.com/workouts/phul-workout" },
  { id: "WP-0006", url: "https://muscleandstrength.com/workouts/5-day-muscle-and-strength-building-workout-split" },
  { id: "WP-0007", url: "https://muscleandstrength.com/workouts/jason-blaha-ice-cream-fitness-5x5-novice-workout" },
  { id: "WP-0008", url: "https://muscleandstrength.com/workouts/8-week-super-strength-workout" },
  { id: "WP-0009", url: "https://muscleandstrength.com/workouts/the-ultimate-bro-split" },
  { id: "WP-0010", url: "https://muscleandstrength.com/workouts/8-week-hypertrophy-workout" },
  { id: "WP-0011", url: "https://muscleandstrength.com/workouts/8-week-womens-beginner-fat-loss-workout" },
  { id: "WP-0012", url: "https://muscleandstrength.com/workouts/8-week-womens-workout-routine" },
  { id: "WP-0013", url: "https://muscleandstrength.com/workouts/6-week-bodyweight-only-workout" },
  { id: "WP-0014", url: "https://muscleandstrength.com/workouts/limited-equipment-home-workout" },
  { id: "WP-0015", url: "https://muscleandstrength.com/workouts/the-complete-squat-program" },
  { id: "WP-0016", url: "https://muscleandstrength.com/workouts/deadlift-specialization-program" },
  { id: "WP-0017", url: "https://muscleandstrength.com/workouts/10-week-fat-torcher" },
  { id: "WP-0018", url: "https://muscleandstrength.com/workouts/10-week-upper-lower-workout-for-women" },
  { id: "WP-0019", url: "https://muscleandstrength.com/workouts/12-week-kettlebell-ab-workout" },
  { id: "WP-0020", url: "https://muscleandstrength.com/workouts/12-week-military-workout-program" },
  { id: "WP-0021", url: "https://muscleandstrength.com/workouts/12-week-push-pull-legs-for-women" },
  { id: "WP-0022", url: "https://muscleandstrength.com/workouts/12-week-total-transformation-workout" },
  { id: "WP-0023", url: "https://muscleandstrength.com/workouts/12-week-womens-bikini-prep-workout" },
  { id: "WP-0024", url: "https://muscleandstrength.com/workouts/2-week-deload-program" },
  { id: "WP-0025", url: "https://muscleandstrength.com/workouts/20-minute-at-home-full-body-workout" },
  { id: "WP-0026", url: "https://muscleandstrength.com/workouts/20-minute-hiit-workout" },
  { id: "WP-0027", url: "https://muscleandstrength.com/workouts/2014-minutes-better-body-fast-start-plan" },
  { id: "WP-0028", url: "https://muscleandstrength.com/workouts/3-day-at-home-womens-workout" },
  { id: "WP-0029", url: "https://muscleandstrength.com/workouts/3-day-dumbbell-only-workout-for-women" },
  { id: "WP-0030", url: "https://muscleandstrength.com/workouts/3-day-full-body-dumbbell-workout" },
  { id: "WP-0031", url: "https://muscleandstrength.com/workouts/3-day-full-body-kettlebell-workout" },
  { id: "WP-0032", url: "https://muscleandstrength.com/workouts/3-day-full-body-planet-fitness-workout" },
  { id: "WP-0033", url: "https://muscleandstrength.com/workouts/3-day-full-body-workout-for-tall-girls" },
  { id: "WP-0034", url: "https://muscleandstrength.com/workouts/3-day-workout-routine-and-diet-for-beginners" },
  { id: "WP-0035", url: "https://muscleandstrength.com/workouts/300-rise-new-you-workout-muscular-ripped" },
  { id: "WP-0036", url: "https://muscleandstrength.com/workouts/4-5-day-workout-for-building-muscle-and-strength" },
];

async function main() {
  const exerciseIndex = await loadExerciseUrlIndex();
  console.log(`Loaded ${exerciseIndex.size} existing exercise URLs for matching.\n`);

  const failed: string[] = [];
  for (const p of PROGRAMS) {
    try {
      await importProgram(p.url, p.id, exerciseIndex);
    } catch (err) {
      console.error(`Failed to import ${p.id}: ${err instanceof Error ? err.message : String(err)}`);
      failed.push(p.id);
    }
  }

  if (failed.length > 0) {
    console.log(`\n⚠ ${failed.length} programs failed to import: ${failed.join(", ")}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
