import { and, asc, desc, eq, ilike, inArray, isNull, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { sourceExercises, workoutBlocks, workoutItems, workouts } from "@/db/schema";
import { estimateWorkoutMinutes } from "@/domain/workout-duration";

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
  experienceLevel: string | null;
  trainingGoal: string | null;
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
    experienceLevel: workout.experienceLevel,
    trainingGoal: workout.trainingGoal,
    blocks: blockOrder.map((id) => blocksById.get(id)!),
  };
}

export interface WorkoutSummary {
  id: string;
  name: string;
  description: string | null;
  archivedAt: Date | null;
  updatedAt: Date;
  exerciseCount: number;
  estimatedMinutes: number;
}

/**
 * Workout list for the library (Epic G1). Excludes archived workouts unless
 * explicitly requested, and computes exercise count + duration in JS from a
 * single follow-up query rather than a SQL aggregation — simple and correct
 * at the scale a personal app's workout list actually reaches.
 */
export async function listWorkoutSummaries(
  profileId: string,
  options: { search?: string; includeArchived?: boolean } = {},
): Promise<WorkoutSummary[]> {
  const conditions = [eq(workouts.profileId, profileId)];
  conditions.push(options.includeArchived ? isNotNull(workouts.archivedAt) : isNull(workouts.archivedAt));
  if (options.search) conditions.push(ilike(workouts.name, `%${options.search}%`));

  const rows = await db
    .select()
    .from(workouts)
    .where(and(...conditions))
    .orderBy(desc(workouts.updatedAt));

  if (rows.length === 0) return [];

  const workoutIds = rows.map((w) => w.id);
  const blockRows = await db
    .select({
      workoutId: workoutBlocks.workoutId,
      blockId: workoutBlocks.id,
      restSeconds: workoutBlocks.restSeconds,
      sets: workoutItems.sets,
    })
    .from(workoutBlocks)
    .leftJoin(workoutItems, eq(workoutItems.blockId, workoutBlocks.id))
    .where(inArray(workoutBlocks.workoutId, workoutIds));

  const blocksByWorkout = new Map<string, Map<number, { restSeconds: number | null; items: { sets: number }[] }>>();
  const countByWorkout = new Map<string, number>();
  for (const row of blockRows) {
    if (!blocksByWorkout.has(row.workoutId)) blocksByWorkout.set(row.workoutId, new Map());
    const blocks = blocksByWorkout.get(row.workoutId)!;
    if (!blocks.has(row.blockId)) blocks.set(row.blockId, { restSeconds: row.restSeconds, items: [] });
    if (row.sets !== null) {
      blocks.get(row.blockId)!.items.push({ sets: row.sets });
      countByWorkout.set(row.workoutId, (countByWorkout.get(row.workoutId) ?? 0) + 1);
    }
  }

  return rows.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    archivedAt: w.archivedAt,
    updatedAt: w.updatedAt,
    exerciseCount: countByWorkout.get(w.id) ?? 0,
    estimatedMinutes: estimateWorkoutMinutes([...(blocksByWorkout.get(w.id)?.values() ?? [])]),
  }));
}
