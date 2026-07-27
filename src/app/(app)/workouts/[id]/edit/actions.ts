"use server";

import { and, eq, ilike, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { sourceExercises, workoutBlocks, workoutItems, workouts } from "@/db/schema";
import { getActiveProfileId } from "@/lib/active-profile";
import { requireSiteSession } from "@/lib/require-site-session";

const PICKER_LIMIT = 20;

export interface PickerExercise {
  exerciseId: string;
  name: string;
  thumbnailUrl: string | null;
  primaryMuscle: string | null;
  equipment: string | null;
}

/** Lightweight exercise search for the "add exercise" / "substitute" pickers
 * — a name-only search, not the full Exercise Library filter set. */
export async function searchExercisesForPicker(query: string): Promise<PickerExercise[]> {
  await requireSiteSession();

  const trimmed = query.trim();
  return db
    .select({
      exerciseId: sourceExercises.exerciseId,
      name: sourceExercises.name,
      thumbnailUrl: sourceExercises.thumbnailUrl,
      primaryMuscle: sourceExercises.primaryMuscle,
      equipment: sourceExercises.equipment,
    })
    .from(sourceExercises)
    .where(trimmed ? ilike(sourceExercises.name, `%${trimmed}%`) : undefined)
    .orderBy(sourceExercises.name)
    .limit(PICKER_LIMIT);
}

const DEFAULT_SETS = 3;
const DEFAULT_REPS_MIN = 8;
const DEFAULT_REPS_MAX = 12;

async function requireOwnedWorkout(workoutId: string): Promise<string> {
  await requireSiteSession();
  const profileId = await getActiveProfileId();
  if (!profileId) throw new Error("No active profile");

  const [workout] = await db.select().from(workouts).where(eq(workouts.id, workoutId));
  if (!workout || workout.profileId !== profileId) throw new Error("Workout not found");
  return profileId;
}

/** Resolves a block's workoutId and checks ownership; returns the workoutId. */
async function requireOwnedBlock(blockId: number): Promise<string> {
  const [block] = await db.select().from(workoutBlocks).where(eq(workoutBlocks.id, blockId));
  if (!block) throw new Error("Block not found");
  return requireOwnedWorkout(block.workoutId);
}

/** Resolves an item's workoutId (via its block) and checks ownership. */
async function requireOwnedItem(itemId: number): Promise<{ workoutId: string; blockId: number }> {
  const [item] = await db.select().from(workoutItems).where(eq(workoutItems.id, itemId));
  if (!item) throw new Error("Item not found");
  const workoutId = await requireOwnedBlock(item.blockId);
  return { workoutId, blockId: item.blockId };
}

function revalidateBuilder(workoutId: string) {
  revalidatePath(`/workouts/${workoutId}/edit`);
}

const nameSchema = z.string().trim().min(1, "Enter a name.").max(120, "Keep it under 120 characters.");

export async function updateWorkoutMeta(workoutId: string, formData: FormData): Promise<void> {
  await requireOwnedWorkout(workoutId);

  const name = nameSchema.parse(formData.get("name"));
  const description = String(formData.get("description") ?? "").trim() || null;

  await db.update(workouts).set({ name, description, updatedAt: new Date() }).where(eq(workouts.id, workoutId));
  revalidateBuilder(workoutId);
}

/** Adds an exercise as a new single-exercise block at the end of the workout. */
export async function addExerciseAsNewBlock(workoutId: string, exerciseId: string): Promise<void> {
  await requireOwnedWorkout(workoutId);

  const [exists] = await db.select({ id: sourceExercises.exerciseId }).from(sourceExercises).where(eq(sourceExercises.exerciseId, exerciseId));
  if (!exists) throw new Error("Exercise not found");

  await db.transaction(async (tx) => {
    const [{ maxPos }] = await tx
      .select({ maxPos: max(workoutBlocks.position) })
      .from(workoutBlocks)
      .where(eq(workoutBlocks.workoutId, workoutId));

    const [block] = await tx
      .insert(workoutBlocks)
      .values({ workoutId, position: (maxPos ?? -1) + 1, kind: "single", restSeconds: 90 })
      .returning();

    await tx.insert(workoutItems).values({
      blockId: block.id,
      exerciseId,
      position: 0,
      sets: DEFAULT_SETS,
      repsMin: DEFAULT_REPS_MIN,
      repsMax: DEFAULT_REPS_MAX,
    });
  });

  revalidateBuilder(workoutId);
}

/** Adds an exercise into an existing block, grouping it as a superset. */
export async function addExerciseToBlock(blockId: number, exerciseId: string): Promise<void> {
  const workoutId = await requireOwnedBlock(blockId);

  await db.transaction(async (tx) => {
    const [{ maxPos }] = await tx
      .select({ maxPos: max(workoutItems.position) })
      .from(workoutItems)
      .where(eq(workoutItems.blockId, blockId));

    await tx.insert(workoutItems).values({
      blockId,
      exerciseId,
      position: (maxPos ?? -1) + 1,
      sets: DEFAULT_SETS,
      repsMin: DEFAULT_REPS_MIN,
      repsMax: DEFAULT_REPS_MAX,
    });

    const [block] = await tx.select().from(workoutBlocks).where(eq(workoutBlocks.id, blockId));
    if (block.kind === "single") {
      await tx.update(workoutBlocks).set({ kind: "superset" }).where(eq(workoutBlocks.id, blockId));
    }
  });

  revalidateBuilder(workoutId);
}

const prescriptionSchema = z.object({
  sets: z.coerce.number().int().min(1).max(20),
  repsMin: z.coerce.number().int().min(1).max(100).nullable(),
  repsMax: z.coerce.number().int().min(1).max(100).nullable(),
  restSeconds: z.coerce.number().int().min(0).max(1800).nullable(),
  notes: z.string().max(500).nullable(),
});

export async function updateItemPrescription(itemId: number, formData: FormData): Promise<void> {
  const { workoutId } = await requireOwnedItem(itemId);

  const raw = {
    sets: formData.get("sets"),
    repsMin: formData.get("repsMin") || null,
    repsMax: formData.get("repsMax") || null,
    restSeconds: formData.get("restSeconds") || null,
    notes: (formData.get("notes") as string | null)?.trim() || null,
  };
  const parsed = prescriptionSchema.parse(raw);

  await db
    .update(workoutItems)
    .set({
      sets: parsed.sets,
      repsMin: parsed.repsMin,
      repsMax: parsed.repsMax,
      restSeconds: parsed.restSeconds,
      notes: parsed.notes,
    })
    .where(eq(workoutItems.id, itemId));

  revalidateBuilder(workoutId);
}

export async function updateBlockRest(blockId: number, formData: FormData): Promise<void> {
  const workoutId = await requireOwnedBlock(blockId);
  const restSeconds = z.coerce.number().int().min(0).max(1800).parse(formData.get("restSeconds"));
  await db.update(workoutBlocks).set({ restSeconds }).where(eq(workoutBlocks.id, blockId));
  revalidateBuilder(workoutId);
}

export async function updateBlockKind(blockId: number, kind: "superset" | "circuit"): Promise<void> {
  const workoutId = await requireOwnedBlock(blockId);
  await db.update(workoutBlocks).set({ kind }).where(eq(workoutBlocks.id, blockId));
  revalidateBuilder(workoutId);
}

/** Removes an item; if its block is left empty, the block is removed too. */
export async function removeItem(itemId: number): Promise<void> {
  const { workoutId, blockId } = await requireOwnedItem(itemId);

  await db.transaction(async (tx) => {
    await tx.delete(workoutItems).where(eq(workoutItems.id, itemId));

    const remaining = await tx.select().from(workoutItems).where(eq(workoutItems.blockId, blockId));
    if (remaining.length === 0) {
      await tx.delete(workoutBlocks).where(eq(workoutBlocks.id, blockId));
    } else if (remaining.length === 1) {
      await tx.update(workoutBlocks).set({ kind: "single" }).where(eq(workoutBlocks.id, blockId));
    }
  });

  revalidateBuilder(workoutId);
}

export async function substituteExercise(itemId: number, newExerciseId: string): Promise<void> {
  const { workoutId } = await requireOwnedItem(itemId);

  const [exists] = await db
    .select({ id: sourceExercises.exerciseId })
    .from(sourceExercises)
    .where(eq(sourceExercises.exerciseId, newExerciseId));
  if (!exists) throw new Error("Exercise not found");

  await db.update(workoutItems).set({ exerciseId: newExerciseId }).where(eq(workoutItems.id, itemId));
  revalidateBuilder(workoutId);
}

/** Persists a new block order after a drag-and-drop reorder. */
export async function reorderBlocks(workoutId: string, orderedBlockIds: number[]): Promise<void> {
  await requireOwnedWorkout(workoutId);

  await db.transaction(async (tx) => {
    for (const [index, blockId] of orderedBlockIds.entries()) {
      await tx
        .update(workoutBlocks)
        .set({ position: index })
        .where(and(eq(workoutBlocks.id, blockId), eq(workoutBlocks.workoutId, workoutId)));
    }
  });

  revalidateBuilder(workoutId);
}
