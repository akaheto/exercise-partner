import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sourceExercises, workoutBlocks, workoutItems, workouts } from "@/db/schema";

export interface WorkoutItemForEdit {
  id: number;
  position: number;
  exerciseId: string;
  exerciseName: string;
  exerciseThumbnail: string | null;
  exercisePrimaryMuscle: string | null;
  exerciseSecondaryMuscles: string | null;
  exerciseBodyRegion: string | null;
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  restSeconds: number | null;
  notes: string | null;
}

export interface WorkoutBlockForEdit {
  id: number;
  position: number;
  kind: string;
  restSeconds: number | null;
  items: WorkoutItemForEdit[];
}

export interface WorkoutForEdit {
  id: string;
  profileId: string;
  name: string;
  description: string | null;
  blocks: WorkoutBlockForEdit[];
}

/** Fetches a workout with its full block/item tree for the builder. Returns
 * null if it doesn't exist or belongs to a different profile. */
export async function getWorkoutForEdit(workoutId: string, profileId: string): Promise<WorkoutForEdit | null> {
  const [workout] = await db.select().from(workouts).where(eq(workouts.id, workoutId));
  if (!workout || workout.profileId !== profileId) return null;

  const rows = await db
    .select({
      blockId: workoutBlocks.id,
      blockPosition: workoutBlocks.position,
      blockKind: workoutBlocks.kind,
      blockRestSeconds: workoutBlocks.restSeconds,
      itemId: workoutItems.id,
      itemPosition: workoutItems.position,
      exerciseId: workoutItems.exerciseId,
      exerciseName: sourceExercises.name,
      exerciseThumbnail: sourceExercises.thumbnailUrl,
      exercisePrimaryMuscle: sourceExercises.primaryMuscle,
      exerciseSecondaryMuscles: sourceExercises.secondaryMuscles,
      exerciseBodyRegion: sourceExercises.bodyRegion,
      sets: workoutItems.sets,
      repsMin: workoutItems.repsMin,
      repsMax: workoutItems.repsMax,
      itemRestSeconds: workoutItems.restSeconds,
      notes: workoutItems.notes,
    })
    .from(workoutBlocks)
    .leftJoin(workoutItems, eq(workoutItems.blockId, workoutBlocks.id))
    .leftJoin(sourceExercises, eq(sourceExercises.exerciseId, workoutItems.exerciseId))
    .where(eq(workoutBlocks.workoutId, workoutId))
    .orderBy(asc(workoutBlocks.position), asc(workoutItems.position));

  const blocksById = new Map<number, WorkoutBlockForEdit>();
  const blockOrder: number[] = [];
  for (const row of rows) {
    if (!blocksById.has(row.blockId)) {
      blocksById.set(row.blockId, {
        id: row.blockId,
        position: row.blockPosition,
        kind: row.blockKind,
        restSeconds: row.blockRestSeconds,
        items: [],
      });
      blockOrder.push(row.blockId);
    }
    if (row.itemId !== null) {
      blocksById.get(row.blockId)!.items.push({
        id: row.itemId,
        position: row.itemPosition!,
        exerciseId: row.exerciseId!,
        exerciseName: row.exerciseName ?? "(exercise removed)",
        exerciseThumbnail: row.exerciseThumbnail,
        exercisePrimaryMuscle: row.exercisePrimaryMuscle,
        exerciseSecondaryMuscles: row.exerciseSecondaryMuscles,
        exerciseBodyRegion: row.exerciseBodyRegion,
        sets: row.sets!,
        repsMin: row.repsMin,
        repsMax: row.repsMax,
        restSeconds: row.itemRestSeconds,
        notes: row.notes,
      });
    }
  }

  return {
    id: workout.id,
    profileId: workout.profileId,
    name: workout.name,
    description: workout.description,
    blocks: blockOrder.map((id) => blocksById.get(id)!),
  };
}

export function listWorkoutsForProfile(profileId: string) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.profileId, profileId))
    .orderBy(asc(workouts.createdAt));
}
