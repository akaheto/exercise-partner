/**
 * Imports workout programs from a structured, pre-extracted site export
 * (data/source/workouts/*.xlsx) rather than scraping HTML directly — the
 * companion, structured-data path to scripts/import-workout-programs.ts,
 * which still owns the original HTML-scrape-based import. Written for the
 * 2026-09-02 fresh extract (613 programs, a full alphabetical pass of the
 * site, vs. the 36 individually curated so far).
 *
 * exceljs (this project's usual .xlsx reader) cannot parse these specific
 * files — their workbook.xml uses a namespace-prefixed root element
 * (<x:workbook xmlns:x="...">) that exceljs's simplified parser doesn't
 * recognize, confirmed by inspecting the raw XML, not guessed. Falls back
 * to a small Python helper (scripts/xlsx_to_json.py, requires openpyxl)
 * for the read, same pattern as scripts/docs/docx-to-web.py existing for a
 * similar Node-toolchain gap.
 *
 * Source layer only (see src/db/schema/source.ts's doc comment) — never
 * touches a profile's own saved workouts. Matches an existing program by
 * canonical URL (see slugFromUrl/normalizeUrl) and updates it in place,
 * keeping its existing program_id, rather than creating a duplicate; a
 * program not currently in the database gets a newly allocated one. Days
 * (and their exercises, via cascade) are fully replaced for every program
 * touched, matching the "rebuilt on re-run" convention the rest of the
 * source layer already uses — this source has no rest-day information at
 * all (every row's Day Type is "Workout"), so re-running this against an
 * existing program does lose any explicit rest-day rows a prior HTML-scrape
 * import had recorded for it. That doesn't change what "Add to my workouts"
 * (Epic Q3) produces, since it already skips rest days entirely — only the
 * day-by-day browse view (Epic Q2) stops showing them as their own row.
 *
 * Usage: npm run import:workout-extract [-- --dry-run]
 */
import "./load-env";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import * as path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import {
  sourceExercises,
  sourceWorkoutProgramDays,
  sourceWorkoutProgramExercises,
  sourceWorkoutPrograms,
} from "../src/db/schema";
import { categorizeProgram, slugFromUrl } from "../src/domain/workout-program-conversion";

const DRY_RUN = process.argv.includes("--dry-run");

const BATCH_FILES = [
  "data/source/workouts/muscle_strength_workout_database_batch_001.xlsx",
  "data/source/workouts/muscle_strength_workout_database_batch_002.xlsx",
  "data/source/workouts/muscle_strength_workout_database_batch_003.xlsx",
  "data/source/workouts/muscle_strength_workout_database_batch_004.xlsx",
];

type SheetRow = Record<string, unknown>;
type SheetData = Record<string, SheetRow[]>;

/** Windows ships `python`/`python3` as "App Execution Alias" stubs that
 * launch, print this message to stderr, and exit non-zero — not a clean
 * ENOENT, so it doesn't trip the usual "command not found" check. Confirmed
 * against a real failure on this project's own dev machine, not guessed. */
function isWindowsStoreStub(stderr: string | undefined): boolean {
  return Boolean(stderr && /Microsoft Store/i.test(stderr) && /Python was not found/i.test(stderr));
}

function readXlsxSheets(filePath: string): SheetData {
  const scriptPath = path.join(__dirname, "xlsx_to_json.py");
  const candidates = ["python3", "python"];
  let lastError: Error | null = null;
  for (const python of candidates) {
    try {
      const output = execFileSync(python, [scriptPath, filePath], {
        maxBuffer: 200 * 1024 * 1024,
        encoding: "utf-8",
        // Capture stderr instead of inheriting it, so a failed first
        // candidate (e.g. Windows' python3 App Execution Alias stub, see
        // isWindowsStoreStub below) doesn't print noise before the
        // fallback silently succeeds.
        stdio: ["ignore", "pipe", "pipe"],
      });
      return JSON.parse(output);
    } catch (err) {
      const nodeErr = err as NodeJS.ErrnoException & { stderr?: string };
      if (nodeErr.code === "ENOENT" || isWindowsStoreStub(nodeErr.stderr)) {
        lastError = nodeErr;
        continue;
      }
      throw err;
    }
  }
  throw new Error(
    `Neither python3 nor python is available to read ${filePath}. ${lastError?.message ?? ""}`,
  );
}

function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

function canonicalUrl(url: string): string {
  // Everything imported so far (both the HTML-scrape script and the
  // original spreadsheet import) uses the no-www form — matched here so
  // this source doesn't introduce a second URL convention into the table.
  // normalizeUrl already strips the protocol/www and keeps the domain, so
  // this only needs to add the protocol back — prepending a hardcoded
  // domain here (an earlier version of this function did) double-counts
  // it, producing "muscleandstrength.com/muscleandstrength.com/...".
  return `https://${normalizeUrl(url)}`;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function parseIntOrNull(v: unknown): number | null {
  const s = str(v);
  if (!s) return null;
  const match = s.match(/\d+/);
  return match ? Number(match[0]) : null;
}

/** Exact, reviewed denylist rather than a fuzzy pattern — found by scanning
 * every distinct exercise_name_raw already in production and hand-checking
 * each one, 2 September 2026 (PROJECT_PLAN.docx section 4). These are
 * instructional text or table artifacts (percentage-based programming
 * labels, a literal "Rest"/"Superset:", warm-up-complex descriptions) that
 * the extract captured as if they were exercise rows on a handful of pages
 * with irregular table formats. Deliberately exact-match, not a regex like
 * `/% of 1rm/i` — that would also delete real prescriptions such as
 * "Deadlift (60% of 1RM)" or "Warm-Up: Dumbbell Press", which name a real
 * exercise and must be kept. */
const GARBAGE_EXERCISE_NAMES = new Set(
  [
    "1. Dynamic Warm Up",
    "100% of 1RM",
    "105% of 1RM (If you make this, try 107.5%)",
    "107.5% of 1RM (If you make this, try 110%)",
    "110% of 1RM",
    "35% of 1RM",
    "45% of 1RM",
    "55% of 1RM",
    "60% of 1RM",
    "65% of 1RM",
    "70% of 1RM",
    "75% of 1RM",
    "80% of 1RM",
    "85% of 1RM",
    "90% of 1RM",
    "92.5% of 1RM",
    "95% of 1RM",
    "Alternate sets of:",
    "Barbell/Dumbbell",
    "Bodyweight",
    "Cardio",
    "Dynamic warm-up complex",
    "Perform the complex for one to three rounds",
    "Rest",
    "Superset",
    "Superset:",
    "Warmup - Calisthenics complex",
  ].map((s) => s.toLowerCase()),
);

interface ProgramRecord {
  workoutId: string;
  name: string;
  url: string;
  description: string | null;
  mainGoal: string | null;
  workoutType: string | null;
  trainingLevel: string | null;
  durationWeeks: number | null;
  daysPerWeek: number | null;
  timePerWorkout: string | null;
  equipmentNeeded: string | null;
  targetGender: string | null;
  /** "Summary lists N days per week; K distinct workout table titles were
   * parsed." or "Source uses a narrative workout format; ..." or null when
   * the source's own stated Days Per Week already matched what was parsed.
   * Used only to decide whether a real single-day (or few-day) program
   * should be duplicated to fill out a stated weekly frequency — the
   * narrative-format case is explicitly excluded from that (see below). */
  consistencyNotes: string | null;
}

interface DayRecord {
  workoutId: string;
  dayNumber: number;
  dayTitle: string | null;
}

interface ExerciseRecord {
  workoutId: string;
  dayTitle: string | null;
  position: number;
  exerciseNameRaw: string;
  exerciseUrlRaw: string | null;
  sets: string | null;
  reps: string | null;
  rest: string | null;
  notes: string | null;
}

function loadAllBatches(): { programs: ProgramRecord[]; days: DayRecord[]; exercises: ExerciseRecord[] } {
  const programs: ProgramRecord[] = [];
  const days: DayRecord[] = [];
  const exercises: ExerciseRecord[] = [];

  for (const file of BATCH_FILES) {
    console.log(`Reading ${file}...`);
    const sheets = readXlsxSheets(file);

    for (const row of sheets["Workout Programs"] ?? []) {
      const url = str(row["Source URL"]);
      if (!url) continue;
      programs.push({
        workoutId: String(row["Workout ID"]),
        name: str(row["Workout Name"]) ?? String(row["Workout ID"]),
        url,
        description: str(row["Short Description"]),
        mainGoal: str(row["Primary Goal"]),
        workoutType: str(row["Workout Type"]),
        trainingLevel: str(row["Experience Level"]),
        durationWeeks: parseIntOrNull(row["Program Length"]),
        daysPerWeek: parseIntOrNull(row["Days Per Week"]),
        timePerWorkout: str(row["Estimated Workout Duration"]),
        equipmentNeeded: str(row["Equipment Required"]),
        targetGender: str(row["Target Gender"]),
        consistencyNotes: str(row["Source Consistency Notes"]),
      });
    }

    for (const row of sheets["Workout Days"] ?? []) {
      const dayNumber = parseIntOrNull(row["Day Number"]);
      if (dayNumber === null) continue;
      days.push({
        workoutId: String(row["Workout ID"]),
        dayNumber,
        dayTitle: str(row["Day Title"]),
      });
    }

    for (const row of sheets["Workout Exercises"] ?? []) {
      const name = str(row["Exercise Name"]);
      if (!name) continue;
      if (GARBAGE_EXERCISE_NAMES.has(name.toLowerCase())) continue;
      // No Sets/Reps column populated is common for timed/burnout entries
      // (e.g. "20 Secs" plank/jump-rope intervals) — Duration is the only
      // place that shows up in this source. Folded into `sets` so the
      // existing parsePrescription (src/domain/workout-program-
      // conversion.ts) fallback for a non-numeric "sets" string — 1 set,
      // original text kept as a note — still applies unchanged.
      const sets = str(row["Sets"]) ?? str(row["Duration"]);
      exercises.push({
        workoutId: String(row["Workout ID"]),
        dayTitle: str(row["Workout Day"]),
        position: parseIntOrNull(row["Exercise Order"]) ?? 0,
        exerciseNameRaw: name,
        exerciseUrlRaw: str(row["Exercise URL"]),
        sets,
        reps: str(row["Reps"]),
        rest: str(row["Rest Period"]),
        notes: str(row["Notes"]),
      });
    }
  }

  return { programs, days, exercises };
}

async function loadExerciseUrlIndex(): Promise<Map<string, string>> {
  const rows = await db.select({ exerciseId: sourceExercises.exerciseId, url: sourceExercises.url }).from(sourceExercises);
  const index = new Map<string, string>();
  for (const r of rows) {
    if (r.url) index.set(slugFromUrl(r.url), r.exerciseId);
  }
  return index;
}

async function nextProgramId(): Promise<() => string> {
  const rows = await db.select({ programId: sourceWorkoutPrograms.programId }).from(sourceWorkoutPrograms);
  let max = 0;
  for (const r of rows) {
    const n = Number(r.programId.replace(/^WP-/, ""));
    if (Number.isFinite(n) && n > max) max = n;
  }
  let next = max;
  return () => {
    next += 1;
    return `WP-${String(next).padStart(4, "0")}`;
  };
}

async function main() {
  const { programs, days, exercises } = loadAllBatches();
  console.log(`\nParsed ${programs.length} programs, ${days.length} days, ${exercises.length} exercise rows.\n`);

  const existingRows = await db
    .select({ programId: sourceWorkoutPrograms.programId, url: sourceWorkoutPrograms.url })
    .from(sourceWorkoutPrograms);
  const existingByUrl = new Map(existingRows.map((r) => [normalizeUrl(r.url), r.programId]));

  const exerciseIndex = await loadExerciseUrlIndex();
  const allocateProgramId = await nextProgramId();

  const daysByWorkoutId = new Map<string, DayRecord[]>();
  for (const d of days) {
    if (!daysByWorkoutId.has(d.workoutId)) daysByWorkoutId.set(d.workoutId, []);
    daysByWorkoutId.get(d.workoutId)!.push(d);
  }
  const exercisesByWorkoutId = new Map<string, ExerciseRecord[]>();
  for (const e of exercises) {
    if (!exercisesByWorkoutId.has(e.workoutId)) exercisesByWorkoutId.set(e.workoutId, []);
    exercisesByWorkoutId.get(e.workoutId)!.push(e);
  }

  let created = 0;
  let updated = 0;
  let totalDays = 0;
  let totalExercises = 0;
  let totalMatched = 0;
  const unmatchedExerciseNames = new Set<string>();

  for (const program of programs) {
    const norm = normalizeUrl(program.url);
    const existingProgramId = norm ? existingByUrl.get(norm) : undefined;
    const programId = existingProgramId ?? allocateProgramId();
    const isNew = !existingProgramId;

    const category = categorizeProgram(program.name, {
      mainGoal: program.mainGoal,
      targetGender: program.targetGender,
      equipmentRequired: program.equipmentNeeded,
    });

    // Exercises link to a day by title text ("Workout A"), not day number —
    // the source's own join key, not one this script invents (see the
    // per-day filter below).
    const programExercises = exercisesByWorkoutId.get(program.workoutId) ?? [];

    // For a "narrative format" source page (source's own Source Consistency
    // Notes column flags ~38 of these), the extract fabricates placeholder
    // day-title scaffolding from the stated Days Per Week count (e.g. "Workout
    // #1".."#5", or generic muscle-group names) alongside the one real day
    // — titled "Workout" — that actually holds the parsed content. Both land
    // in the Workout Days sheet with no way to tell them apart there, but the
    // scaffolding rows never appear as any exercise row's Workout Day value,
    // so they carry zero linked exercises. Confirmed against the raw sheets
    // for several examples before writing this filter: the "real" day's
    // exercises never appear anywhere else, so nothing is lost by dropping
    // the zero-exercise rows — verified 2 September 2026 (PROJECT_PLAN.docx
    // section 4 open items). Left unfiltered, these inflated the visible day
    // count (a "3 day" program showing 4-6 mostly-empty day cards) and, when
    // a scaffold row and the real row shared a day number, produced a
    // duplicate "Day 1" for the same program.
    const titlesWithExercises = new Set(programExercises.map((e) => e.dayTitle));
    const programDays = (daysByWorkoutId.get(program.workoutId) ?? [])
      .filter((d) => titlesWithExercises.has(d.dayTitle))
      .sort((a, b) => a.dayNumber - b.dayNumber);

    const sourceRowHash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ program, programDays, programExercises }))
      .digest("hex");

    // Some programs are genuinely one (or a few) real day template(s) meant
    // to be trained more often per week than there are distinct templates —
    // e.g. a single "Full Body" day done 3x/week (Mon/Wed/Fri). The source's
    // own stated Days Per Week is trustworthy for THIS specific case: it's
    // flagged with "Summary lists N days per week; K distinct workout table
    // titles were parsed" (K < N) rather than the narrative-format note,
    // which instead flags pages with genuinely uncertain, often-blank
    // prescriptions (confirmed by reading both note patterns' example pages
    // directly — WP-0388 "Introduction To Bodybuilding Workout", a real,
    // fully-prescribed single day repeated 3x/week per the page's own
    // description, carries the first pattern; WP-0063/WP-0531, narrative
    // dumps with no real per-day schedule, carry the second — 2 September
    // 2026, PROJECT_PLAN.docx section 4). Cycles through the real day
    // template(s) in order to fill out the stated count, per user request:
    // "3 identical days should show up as day 1, 2 and 3."
    const isNarrativeFormat = /narrative/i.test(program.consistencyNotes ?? "");
    const shouldDuplicate =
      !isNarrativeFormat &&
      programDays.length >= 1 &&
      program.daysPerWeek !== null &&
      program.daysPerWeek > programDays.length;

    const expandedDays: DayRecord[] = shouldDuplicate
      ? Array.from({ length: program.daysPerWeek! }, (_, i) => {
          const template = programDays[i % programDays.length];
          return { workoutId: program.workoutId, dayNumber: i + 1, dayTitle: template.dayTitle };
        })
      : programDays;

    totalDays += expandedDays.length;
    // Not a simple multiply-by-cycle-factor: the cycle needn't divide evenly
    // (e.g. 2 real days repeated to fill a stated 5/week), so different
    // expanded days can carry different exercise counts. Summed per expanded
    // day's own template title instead.
    const exerciseCountByTitle = new Map<string | null, number>();
    for (const ex of programExercises) {
      exerciseCountByTitle.set(ex.dayTitle, (exerciseCountByTitle.get(ex.dayTitle) ?? 0) + 1);
    }
    totalExercises += expandedDays.reduce((sum, d) => sum + (exerciseCountByTitle.get(d.dayTitle) ?? 0), 0);

    // Derived from the real (filtered, and where applicable duplicated) day
    // count rather than trusted from the source's own "Days Per Week" field
    // directly: the source extract's Source Consistency Notes flag 279
    // programs where that field disagreed with the actual parsed day-table
    // count, and 38 narrative-format programs where it's essentially
    // fabricated (see above). The real day list is ground truth for what
    // this program actually contains; duplication (above) folds the stated
    // frequency back in for the specific case where it's trustworthy.
    const realDaysPerWeek = expandedDays.length > 0 ? expandedDays.length : null;

    if (DRY_RUN) {
      if (isNew) created++;
      else updated++;
      continue;
    }

    await db.transaction(async (tx) => {
      const url = canonicalUrl(program.url);
      await tx
        .insert(sourceWorkoutPrograms)
        .values({
          programId,
          name: program.name,
          url,
          description: program.description,
          category,
          mainGoal: program.mainGoal,
          workoutType: program.workoutType,
          trainingLevel: program.trainingLevel,
          durationWeeks: program.durationWeeks,
          daysPerWeek: realDaysPerWeek,
          timePerWorkout: program.timePerWorkout,
          equipmentNeeded: program.equipmentNeeded,
          targetGender: program.targetGender,
          sourceRowHash,
        })
        .onConflictDoUpdate({
          target: sourceWorkoutPrograms.programId,
          set: {
            name: program.name,
            url,
            description: program.description,
            category,
            mainGoal: program.mainGoal,
            workoutType: program.workoutType,
            trainingLevel: program.trainingLevel,
            durationWeeks: program.durationWeeks,
            daysPerWeek: realDaysPerWeek,
            timePerWorkout: program.timePerWorkout,
            equipmentNeeded: program.equipmentNeeded,
            targetGender: program.targetGender,
            sourceRowHash,
          },
        });

      await tx.delete(sourceWorkoutProgramDays).where(eq(sourceWorkoutProgramDays.programId, programId));
      if (expandedDays.length === 0) return;

      // Bulk insert every day in one round trip, then every exercise in one
      // more — the original per-row-awaited version measured at ~35s/program
      // against Neon's real network latency (~29 sequential round trips per
      // program, 613 programs), an estimated 6-hour total. Batching brings
      // it to 3 round trips per program regardless of size.
      const dayRows = await tx
        .insert(sourceWorkoutProgramDays)
        .values(
          expandedDays.map((day) => ({
            programId,
            dayNumber: day.dayNumber,
            isRestDay: false,
            focus: day.dayTitle,
          })),
        )
        .returning({ id: sourceWorkoutProgramDays.id, focus: sourceWorkoutProgramDays.focus });

      // Grouped as title -> id[], not title -> id: duplicated days (above)
      // deliberately share the same focus text across several distinct day
      // rows (e.g. three "Legs" days), and every exercise tagged for that
      // title needs to be copied onto each of them. For a program with no
      // duplication, every title maps to exactly one id (confirmed zero
      // programs have a naturally-repeated day title pre-duplication — see
      // PROJECT_PLAN.docx section 4), so this is a no-op fan-out there.
      const dayIdsByTitle = new Map<string | null, number[]>();
      for (const r of dayRows) {
        if (!dayIdsByTitle.has(r.focus)) dayIdsByTitle.set(r.focus, []);
        dayIdsByTitle.get(r.focus)!.push(r.id);
      }

      const exerciseValues = programExercises.flatMap((ex) => {
        const dayIds = dayIdsByTitle.get(ex.dayTitle ?? null);
        if (!dayIds) return []; // exercise references a day this program doesn't have
        const matchedExerciseId = ex.exerciseUrlRaw ? exerciseIndex.get(slugFromUrl(ex.exerciseUrlRaw)) ?? null : null;
        if (!matchedExerciseId) unmatchedExerciseNames.add(ex.exerciseNameRaw);
        else totalMatched += dayIds.length;
        return dayIds.map((dayId) => ({
          programDayId: dayId,
          position: ex.position,
          exerciseId: matchedExerciseId,
          exerciseNameRaw: ex.exerciseNameRaw,
          exerciseUrlRaw: ex.exerciseUrlRaw,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          notes: ex.notes,
        }));
      });

      if (exerciseValues.length > 0) {
        await tx.insert(sourceWorkoutProgramExercises).values(exerciseValues);
      }
    });

    if (isNew) created++;
    else updated++;
  }

  console.log(`\n${DRY_RUN ? "[DRY RUN] " : ""}Programs: ${created} to create, ${updated} to update.`);
  console.log(`Total days: ${totalDays}. Total exercise rows: ${totalExercises}.`);
  if (!DRY_RUN) {
    console.log(`Exercise rows matched to an existing library exercise: ${totalMatched}/${totalExercises}.`);
    console.log(`Distinct unmatched exercise names: ${unmatchedExerciseNames.size}.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
