"use server";

import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { workoutBlocks, workoutItems, workouts } from "@/db/schema";
import { getWorkoutProgramWithDays } from "@/db/queries/workout-programs";
import { parsePrescription } from "@/domain/workout-program-conversion";
import { getActiveProfileId } from "@/lib/active-profile";
import { requireSiteSession } from "@/lib/require-site-session";

const DEFAULT_BLOCK_REST_SECONDS = 90;

/**
 * Creates one workout per training day in the program (Epic Q3), skipping
 * rest days entirely and skipping any individual exercise row the scraper
 * couldn't match to a real library exercise — workout_items.exercise_id is
 * not nullable, so there is nothing valid to write for those. Skipped
 * exercise names are surfaced via a query param on the /workouts redirect
 * rather than silently dropped.
 */
export async function addWorkoutProgramToWorkouts(programId: string): Promise<void> {
  await requireSiteSession();

  const profileId = await getActiveProfileId();
  if (!profileId) redirect("/profile");

  const result = await getWorkoutProgramWithDays(programId);
  if (!result) redirect("/build/library");

  const { program, days } = result;
  const trainingDays = days.filter((day) => !day.isRestDay && day.exercises.length > 0);
  if (trainingDays.length === 0) redirect(`/build/library/${programId}`);

  const skipped = new Set<string>();
  let createdCount = 0;

  await db.transaction(async (tx) => {
    for (const day of trainingDays) {
      const matchedExercises = day.exercises.filter((exercise) => {
        if (exercise.exerciseId) return true;
        skipped.add(exercise.exerciseNameRaw);
        return false;
      });
      if (matchedExercises.length === 0) continue;

      const [workout] = await tx
        .insert(workouts)
        .values({
          profileId,
          name: `${program.name} — Day ${day.dayNumber}${day.focus ? `: ${day.focus}` : ""}`,
          description: `Imported from the Workout Library (${program.name}).`,
        })
        .returning();
      createdCount += 1;

      for (const [index, exercise] of matchedExercises.entries()) {
        const prescription = parsePrescription(
          exercise.sets,
          exercise.reps,
          exercise.rest,
          exercise.notes,
        );
        const [block] = await tx
          .insert(workoutBlocks)
          .values({
            workoutId: workout.id,
            position: index,
            kind: "single",
            restSeconds: prescription.restSeconds ?? DEFAULT_BLOCK_REST_SECONDS,
          })
          .returning();
        await tx.insert(workoutItems).values({
          blockId: block.id,
          exerciseId: exercise.exerciseId!,
          position: 0,
          sets: prescription.sets,
          repsMin: prescription.repsMin,
          repsMax: prescription.repsMax,
          notes: prescription.notes,
        });
      }
    }
  });

  const params = new URLSearchParams();
  params.set("added", String(createdCount));
  if (skipped.size > 0) params.set("skipped", [...skipped].join(", "));
  redirect(`/workouts?${params.toString()}`);
}
