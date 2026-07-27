"use server";

import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { sourceExercises, workoutBlocks, workoutItems, workouts } from "@/db/schema";
import { getActiveProfileId } from "@/lib/active-profile";
import { requireSiteSession } from "@/lib/require-site-session";
import { inArray } from "drizzle-orm";

const DEFAULT_SETS = 3;
const DEFAULT_REPS_MIN = 8;
const DEFAULT_REPS_MAX = 12;
const DEFAULT_BLOCK_REST_SECONDS = 90;

/** Creates an empty draft workout for the active profile and jumps straight
 * into the builder. There's no "start from scratch" form — a workout with no
 * exercises yet is a perfectly normal starting state. */
export async function startNewWorkout(): Promise<void> {
  await requireSiteSession();

  const profileId = await getActiveProfileId();
  if (!profileId) redirect("/profile");

  const [workout] = await db.insert(workouts).values({ profileId, name: "New workout" }).returning();

  redirect(`/workouts/${workout.id}/edit`);
}

/**
 * Creates a workout from a multi-select in the Exercise Library, one exercise
 * per block with the same defaults manual single-exercise adds get (Epic
 * E1), preserving the order the caller selected them in. Silently drops any
 * id that doesn't resolve to a real exercise rather than failing the whole
 * request over one bad id.
 */
export async function createWorkoutFromSelection(exerciseIds: string[]): Promise<void> {
  await requireSiteSession();

  const profileId = await getActiveProfileId();
  if (!profileId) redirect("/profile");
  if (exerciseIds.length === 0) redirect("/exercises");

  const validRows = await db
    .select({ exerciseId: sourceExercises.exerciseId })
    .from(sourceExercises)
    .where(inArray(sourceExercises.exerciseId, exerciseIds));
  const validIds = new Set(validRows.map((r) => r.exerciseId));
  const orderedValidIds = exerciseIds.filter((id) => validIds.has(id));
  if (orderedValidIds.length === 0) redirect("/exercises");

  const workout = await db.transaction(async (tx) => {
    const [w] = await tx
      .insert(workouts)
      .values({ profileId, name: `Workout (${orderedValidIds.length} exercises)` })
      .returning();

    for (const [index, exerciseId] of orderedValidIds.entries()) {
      const [block] = await tx
        .insert(workoutBlocks)
        .values({ workoutId: w.id, position: index, kind: "single", restSeconds: DEFAULT_BLOCK_REST_SECONDS })
        .returning();
      await tx.insert(workoutItems).values({
        blockId: block.id,
        exerciseId,
        position: 0,
        sets: DEFAULT_SETS,
        repsMin: DEFAULT_REPS_MIN,
        repsMax: DEFAULT_REPS_MAX,
      });
    }

    return w;
  });

  redirect(`/workouts/${workout.id}/edit`);
}
