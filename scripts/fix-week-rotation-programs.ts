import "./load-env";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../src/db/client";
import { sourceWorkoutProgramDays, sourceWorkoutProgramExercises, sourceWorkoutPrograms } from "../src/db/schema";

/**
 * PROJECT_PLAN.docx section 4, item 59(a): 7 programs flagged during Q5's
 * content-accuracy pass as having a week-by-week or session-rotation
 * structure the import collapsed into fewer stored days than the source
 * page actually has. Re-verified each of the 7 directly against the live
 * page (via curl — Node's fetch()/Playwright both get Cloudflare-blocked
 * for this site, curl with a normal User-Agent does not) before writing
 * anything here:
 *
 *  - WP-0252, WP-0609: NOT actually affected. Re-checked and confirmed the
 *    stored single/six days already match the live page exactly (WP-0252 is
 *    genuinely one template performed weekly; WP-0609 is six standalone
 *    interchangeable routines, not a fixed sequence). Left untouched.
 *  - WP-0486: exercise content is completely correct (verified every count
 *    against the live page) — only the day titles are truncated (e.g.
 *    "Chest" when the real day is "Chest & Shoulders"). Title-only fix.
 *  - WP-0114, WP-0159, WP-0218, WP-0553: genuinely merged. Each program's
 *    real week/workout boundaries were read directly from the live page and
 *    matched exactly against the existing (already correctly exercise-
 *    matched) row order — this only repartitions existing rows across new
 *    day records, it does not re-scrape or re-match a single exercise.
 *
 * Each program's OLD_STATE assertions are checked before any write, so a
 * DB that has drifted from what was verified above aborts loudly instead of
 * silently corrupting data.
 */

interface Split {
  oldDayNumber: number;
  /** Inclusive position range within that old day. */
  range: [number, number];
  newDayNumber: number;
  newFocus: string;
}

interface ProgramFix {
  programId: string;
  newDaysPerWeek: number;
  oldDayCount: number;
  oldExerciseCounts: number[]; // per old day, in day_number order
  splits: Split[];
}

const RESTRUCTURES: ProgramFix[] = [
  {
    programId: "WP-0114",
    newDaysPerWeek: 4,
    oldDayCount: 1,
    oldExerciseCounts: [14],
    splits: [
      { oldDayNumber: 1, range: [1, 4], newDayNumber: 1, newFocus: "Week 1 - Chest Routine" },
      { oldDayNumber: 1, range: [5, 7], newDayNumber: 2, newFocus: "Week 2 - Chest Routine" },
      { oldDayNumber: 1, range: [8, 11], newDayNumber: 3, newFocus: "Week 3 - Chest Routine" },
      { oldDayNumber: 1, range: [12, 14], newDayNumber: 4, newFocus: "Week 4 - Chest Routine" },
    ],
  },
  {
    programId: "WP-0159",
    newDaysPerWeek: 4,
    oldDayCount: 1,
    oldExerciseCounts: [14],
    splits: [
      { oldDayNumber: 1, range: [1, 3], newDayNumber: 1, newFocus: "Workout #1 (Weeks 1 & 5) - Back" },
      { oldDayNumber: 1, range: [4, 7], newDayNumber: 2, newFocus: "Workout #2 (Weeks 2 & 6) - Back" },
      { oldDayNumber: 1, range: [8, 11], newDayNumber: 3, newFocus: "Workout #3 (Weeks 3 & 7) - Back" },
      { oldDayNumber: 1, range: [12, 14], newDayNumber: 4, newFocus: "Workout #4 (Weeks 4 & 8) - Back" },
    ],
  },
  {
    programId: "WP-0218",
    newDaysPerWeek: 2,
    oldDayCount: 1,
    oldExerciseCounts: [16],
    splits: [
      { oldDayNumber: 1, range: [1, 4], newDayNumber: 1, newFocus: "Week 1 - Blast Workout (Arms)" },
      { oldDayNumber: 1, range: [5, 16], newDayNumber: 2, newFocus: "Week 2 - Pump Workout (Arms)" },
    ],
  },
  {
    programId: "WP-0553",
    newDaysPerWeek: 3,
    oldDayCount: 2,
    oldExerciseCounts: [11, 5],
    splits: [
      { oldDayNumber: 1, range: [1, 6], newDayNumber: 1, newFocus: "Week 1 - Heavy Week (Shoulders & Traps)" },
      { oldDayNumber: 2, range: [1, 5], newDayNumber: 2, newFocus: "Week 2 - Traps Shock Week (Shoulders & Traps)" },
      { oldDayNumber: 1, range: [7, 11], newDayNumber: 3, newFocus: "Week 3 - Shoulders Shock Week (Shoulders & Traps)" },
    ],
  },
];

const TITLE_FIXES: { programId: string; dayNumber: number; oldFocus: string; newFocus: string }[] = [
  { programId: "WP-0486", dayNumber: 1, oldFocus: "Chest", newFocus: "Chest & Shoulders" },
  { programId: "WP-0486", dayNumber: 2, oldFocus: "Back", newFocus: "Back & Abs" },
  { programId: "WP-0486", dayNumber: 3, oldFocus: "Quads", newFocus: "Quads, Hamstrings & Calves" },
  { programId: "WP-0486", dayNumber: 4, oldFocus: "Triceps", newFocus: "Triceps, Biceps & Abs" },
];

async function main() {
  const write = process.argv.includes("--write");

  console.log("=== Title-only fix: WP-0486 ===\n");
  for (const fix of TITLE_FIXES) {
    const [day] = await db
      .select()
      .from(sourceWorkoutProgramDays)
      .where(and(eq(sourceWorkoutProgramDays.programId, fix.programId), eq(sourceWorkoutProgramDays.dayNumber, fix.dayNumber)));
    if (!day) throw new Error(`${fix.programId} day ${fix.dayNumber} not found`);
    if (day.focus !== fix.oldFocus) {
      throw new Error(`${fix.programId} day ${fix.dayNumber}: expected focus "${fix.oldFocus}", found "${day.focus}" — DB has drifted, aborting`);
    }
    console.log(`${fix.programId} day ${fix.dayNumber}: "${fix.oldFocus}" -> "${fix.newFocus}"`);
    if (write) {
      await db.update(sourceWorkoutProgramDays).set({ focus: fix.newFocus }).where(eq(sourceWorkoutProgramDays.id, day.id));
    }
  }

  console.log("\n=== Restructures ===\n");
  for (const fix of RESTRUCTURES) {
    console.log(`--- ${fix.programId} ---`);
    const oldDays = await db
      .select()
      .from(sourceWorkoutProgramDays)
      .where(eq(sourceWorkoutProgramDays.programId, fix.programId))
      .orderBy(sourceWorkoutProgramDays.dayNumber);

    if (oldDays.length !== fix.oldDayCount) {
      throw new Error(`${fix.programId}: expected ${fix.oldDayCount} existing day(s), found ${oldDays.length} — aborting`);
    }

    const exercisesByOldDay = new Map<number, (typeof sourceWorkoutProgramExercises.$inferSelect)[]>();
    for (const day of oldDays) {
      const rows = await db
        .select()
        .from(sourceWorkoutProgramExercises)
        .where(eq(sourceWorkoutProgramExercises.programDayId, day.id))
        .orderBy(sourceWorkoutProgramExercises.position);
      exercisesByOldDay.set(day.dayNumber, rows);
      const expected = fix.oldExerciseCounts[day.dayNumber - 1];
      if (rows.length !== expected) {
        throw new Error(`${fix.programId} old day ${day.dayNumber}: expected ${expected} exercises, found ${rows.length} — aborting`);
      }
    }

    // Group splits by target new day number.
    const byNewDay = new Map<number, { focus: string; exercises: (typeof sourceWorkoutProgramExercises.$inferSelect)[] }>();
    for (const split of fix.splits) {
      const oldRows = exercisesByOldDay.get(split.oldDayNumber)!;
      const slice = oldRows.filter((r) => r.position >= split.range[0] && r.position <= split.range[1]);
      if (slice.length !== split.range[1] - split.range[0] + 1) {
        throw new Error(
          `${fix.programId}: old day ${split.oldDayNumber} positions ${split.range[0]}-${split.range[1]} expected ${split.range[1] - split.range[0] + 1} rows, found ${slice.length}`,
        );
      }
      const existing = byNewDay.get(split.newDayNumber);
      if (existing) {
        existing.exercises.push(...slice);
      } else {
        byNewDay.set(split.newDayNumber, { focus: split.newFocus, exercises: [...slice] });
      }
    }

    const totalOld = fix.oldExerciseCounts.reduce((a, b) => a + b, 0);
    const totalNew = [...byNewDay.values()].reduce((sum, d) => sum + d.exercises.length, 0);
    if (totalNew !== totalOld) {
      throw new Error(`${fix.programId}: exercise count mismatch after split — old ${totalOld}, new ${totalNew}`);
    }

    for (const [dayNum, { focus, exercises }] of [...byNewDay.entries()].sort((a, b) => a[0] - b[0])) {
      console.log(`  new day ${dayNum} "${focus}": ${exercises.length} exercises (${exercises.map((e) => e.exerciseNameRaw).join(", ")})`);
    }
    console.log(`  daysPerWeek: ${fix.oldDayCount === 1 ? 1 : oldDays.length} -> ${fix.newDaysPerWeek}`);

    if (write) {
      // 1. Create the new day rows (day_number 1..N), reusing an existing
      //    row's id in place where its number already matches, to avoid an
      //    unnecessary delete+insert for rows that keep the same number.
      const newDayIds = new Map<number, number>();
      for (const dayNum of byNewDay.keys()) {
        const reusable = oldDays.find((d) => d.dayNumber === dayNum);
        if (reusable) {
          newDayIds.set(dayNum, reusable.id);
        } else {
          const [inserted] = await db
            .insert(sourceWorkoutProgramDays)
            .values({ programId: fix.programId, dayNumber: dayNum, focus: byNewDay.get(dayNum)!.focus })
            .returning({ id: sourceWorkoutProgramDays.id });
          newDayIds.set(dayNum, inserted.id);
        }
      }

      // 2. Reassign every exercise row to its new day + renumbered position.
      for (const [dayNum, { exercises }] of byNewDay.entries()) {
        const targetDayId = newDayIds.get(dayNum)!;
        for (let i = 0; i < exercises.length; i++) {
          await db
            .update(sourceWorkoutProgramExercises)
            .set({ programDayId: targetDayId, position: i + 1 })
            .where(eq(sourceWorkoutProgramExercises.id, exercises[i].id));
        }
      }

      // 3. Update focus on reused day rows (day_number matched but focus text changed).
      for (const [dayNum, { focus }] of byNewDay.entries()) {
        await db.update(sourceWorkoutProgramDays).set({ focus }).where(eq(sourceWorkoutProgramDays.id, newDayIds.get(dayNum)!));
      }

      // 4. Delete any old day row whose number isn't a target (now guaranteed empty).
      const targetNumbers = new Set(byNewDay.keys());
      const staleDayIds = oldDays.filter((d) => !targetNumbers.has(d.dayNumber)).map((d) => d.id);
      if (staleDayIds.length > 0) {
        const remaining = await db
          .select()
          .from(sourceWorkoutProgramExercises)
          .where(inArray(sourceWorkoutProgramExercises.programDayId, staleDayIds));
        if (remaining.length > 0) throw new Error(`${fix.programId}: stale day(s) still have exercises attached — refusing to delete`);
        await db.delete(sourceWorkoutProgramDays).where(inArray(sourceWorkoutProgramDays.id, staleDayIds));
      }

      // 5. Update the program's daysPerWeek to the real count.
      await db.update(sourceWorkoutPrograms).set({ daysPerWeek: fix.newDaysPerWeek }).where(eq(sourceWorkoutPrograms.programId, fix.programId));
    }
    console.log();
  }

  if (!write) {
    console.log("Dry run only — no database writes. Re-run with --write to apply.");
  } else {
    console.log("Applied.");
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
