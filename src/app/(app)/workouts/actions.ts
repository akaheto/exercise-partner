"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { workoutBlocks, workoutItems, workouts } from "@/db/schema";
import { getActiveProfileId } from "@/lib/active-profile";
import { requireSiteSession } from "@/lib/require-site-session";

async function requireOwnedWorkout(workoutId: string) {
  await requireSiteSession();
  const profileId = await getActiveProfileId();
  if (!profileId) redirect("/profile");

  const [workout] = await db.select().from(workouts).where(eq(workouts.id, workoutId));
  if (!workout || workout.profileId !== profileId) throw new Error("Workout not found");
  return { workout, profileId };
}

/** Deep-copies a workout (blocks and items included) as an independent new
 * workout — editing the copy never touches the original. */
export async function duplicateWorkout(workoutId: string): Promise<void> {
  const { workout, profileId } = await requireOwnedWorkout(workoutId);

  const blocks = await db.select().from(workoutBlocks).where(eq(workoutBlocks.workoutId, workoutId)).orderBy(workoutBlocks.position);

  await db.transaction(async (tx) => {
    const [copy] = await tx
      .insert(workouts)
      .values({
        profileId,
        name: `Copy of ${workout.name}`,
        description: workout.description,
        experienceLevel: workout.experienceLevel,
        trainingGoal: workout.trainingGoal,
      })
      .returning();

    for (const block of blocks) {
      const items = await tx.select().from(workoutItems).where(eq(workoutItems.blockId, block.id)).orderBy(workoutItems.position);
      const [newBlock] = await tx
        .insert(workoutBlocks)
        .values({ workoutId: copy.id, position: block.position, kind: block.kind, restSeconds: block.restSeconds })
        .returning();
      if (items.length > 0) {
        await tx.insert(workoutItems).values(
          items.map((item) => ({
            blockId: newBlock.id,
            exerciseId: item.exerciseId,
            position: item.position,
            sets: item.sets,
            repsMin: item.repsMin,
            repsMax: item.repsMax,
            restSeconds: item.restSeconds,
            notes: item.notes,
          })),
        );
      }
    }
  });

  revalidatePath("/workouts");
}

export async function archiveWorkout(workoutId: string): Promise<void> {
  await requireOwnedWorkout(workoutId);
  await db.update(workouts).set({ archivedAt: new Date() }).where(eq(workouts.id, workoutId));
  revalidatePath("/workouts");
}

export async function unarchiveWorkout(workoutId: string): Promise<void> {
  await requireOwnedWorkout(workoutId);
  await db.update(workouts).set({ archivedAt: null }).where(eq(workouts.id, workoutId));
  revalidatePath("/workouts");
}

/** Hard delete — only reachable for an already-archived workout, enforced
 * here rather than trusted from the UI alone. Only removes the caller's own
 * template (workoutBlocks/workoutItems cascade with it); never touches the
 * Workout Library catalog it may have been added from — "Add to my
 * workouts" creates independent rows, not a live reference, so nothing
 * shared is affected. Any logged session history survives too:
 * sessions.workoutId sets null on delete rather than cascading, since
 * workoutSnapshot already has everything needed to display that history. */
export async function deleteWorkoutPermanently(workoutId: string): Promise<void> {
  const { workout } = await requireOwnedWorkout(workoutId);
  if (!workout.archivedAt) throw new Error("Only an archived workout can be permanently deleted");

  await db.delete(workouts).where(eq(workouts.id, workoutId));
  revalidatePath("/workouts");
}
