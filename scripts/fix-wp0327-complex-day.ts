import "./load-env";
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db/client";
import { sourceWorkoutProgramDays, sourceWorkoutProgramExercises, sourceWorkoutPrograms } from "../src/db/schema";

/**
 * PROJECT_PLAN.docx section 4, item 59(b): WP-0327 ("Extreme 6 Day Barbell &
 * Bodyweight Workout") stores its nightly "Barbell & Bodyweight Complex" as
 * its own standalone 7th day. The live page (re-verified directly — see the
 * "Evening Workout" section) says to perform it every night alongside each
 * of the 6 real muscle-building days, not as a separate session: "Perform
 * this each night... Evening - Intense barbell and bodyweight complex
 * routine" runs alongside "Afternoon - Barbell and bodyweight muscle
 * building session" on each of Monday-Saturday.
 *
 * Fix: duplicate the complex's 10 exercises onto each of the 6 muscle days
 * (appended after that day's existing exercises), delete the standalone
 * complex day, renumber the remaining 6 days 1-6, and correct daysPerWeek
 * from 7 to 6 to match the program's own name and its real 6-day split.
 */

const PROGRAM_ID = "WP-0327";

async function main() {
  const write = process.argv.includes("--write");

  const days = await db
    .select()
    .from(sourceWorkoutProgramDays)
    .where(eq(sourceWorkoutProgramDays.programId, PROGRAM_ID))
    .orderBy(sourceWorkoutProgramDays.dayNumber);

  if (days.length !== 7) throw new Error(`expected 7 days, found ${days.length} — aborting`);

  const complexDay = days.find((d) => d.dayNumber === 1)!;
  const muscleDays = days.filter((d) => d.dayNumber !== 1);
  if (complexDay.focus !== "Barbell & Bodyweight Complex") {
    throw new Error(`day 1 focus expected "Barbell & Bodyweight Complex", found "${complexDay.focus}" — DB has drifted, aborting`);
  }

  const complexExercises = await db
    .select()
    .from(sourceWorkoutProgramExercises)
    .where(eq(sourceWorkoutProgramExercises.programDayId, complexDay.id))
    .orderBy(sourceWorkoutProgramExercises.position);
  if (complexExercises.length !== 10) throw new Error(`expected 10 complex exercises, found ${complexExercises.length}`);

  console.log(`Complex day has ${complexExercises.length} exercises: ${complexExercises.map((e) => e.exerciseNameRaw).join(", ")}\n`);

  for (const day of muscleDays) {
    const existing = await db
      .select()
      .from(sourceWorkoutProgramExercises)
      .where(eq(sourceWorkoutProgramExercises.programDayId, day.id))
      .orderBy(sourceWorkoutProgramExercises.position);

    const newDayNumber = day.dayNumber - 1; // 2..7 -> 1..6
    const newFocus = `${day.focus} + Evening Barbell & Bodyweight Complex`;
    console.log(`day ${day.dayNumber} "${day.focus}" -> day ${newDayNumber} "${newFocus}"`);
    console.log(`  ${existing.length} existing + ${complexExercises.length} complex = ${existing.length + complexExercises.length} exercises`);

    if (write) {
      await db
        .update(sourceWorkoutProgramDays)
        .set({ dayNumber: newDayNumber, focus: newFocus })
        .where(eq(sourceWorkoutProgramDays.id, day.id));

      for (let i = 0; i < complexExercises.length; i++) {
        const src = complexExercises[i];
        await db.insert(sourceWorkoutProgramExercises).values({
          programDayId: day.id,
          position: existing.length + i + 1,
          exerciseId: src.exerciseId,
          exerciseNameRaw: src.exerciseNameRaw,
          exerciseUrlRaw: src.exerciseUrlRaw,
          sets: src.sets,
          reps: src.reps,
          rest: src.rest,
          notes: src.notes,
        });
      }
    }
  }

  console.log(`\ndelete standalone day 1 "Barbell & Bodyweight Complex" (${complexExercises.length} exercises)`);
  console.log("daysPerWeek: 7 -> 6");

  if (write) {
    // Renumbering muscle days to 1-6 above frees up day_number=1 before this
    // delete runs, so there's never a moment with two day_number=1 rows.
    await db.delete(sourceWorkoutProgramExercises).where(
      inArray(
        sourceWorkoutProgramExercises.id,
        complexExercises.map((e) => e.id),
      ),
    );
    await db.delete(sourceWorkoutProgramDays).where(eq(sourceWorkoutProgramDays.id, complexDay.id));
    await db.update(sourceWorkoutPrograms).set({ daysPerWeek: 6 }).where(eq(sourceWorkoutPrograms.programId, PROGRAM_ID));
    console.log("\nApplied.");
  } else {
    console.log("\nDry run only — no database writes. Re-run with --write to apply.");
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
