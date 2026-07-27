import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { sourceExercises } from "@/db/schema";
import type { GeneratorCandidate } from "@/domain/generator/types";

/**
 * Fetches the candidate pool for the generator, filtered to the given
 * equipment (by canonical name — source_exercises.equipment is a single
 * canonical equipment name per row, already matching source_equipment's
 * naming, so no join is needed). An empty array is a valid input and
 * correctly yields no candidates — the generator surfaces that as a warning
 * rather than silently producing nothing.
 */
export async function fetchCandidatePool(equipmentNames: string[]): Promise<GeneratorCandidate[]> {
  if (equipmentNames.length === 0) return [];

  const rows = await db
    .select({
      exerciseId: sourceExercises.exerciseId,
      name: sourceExercises.name,
      primaryMuscle: sourceExercises.primaryMuscle,
      mechanics: sourceExercises.mechanics,
      experienceLevel: sourceExercises.experienceLevel,
      bodyRegion: sourceExercises.bodyRegion,
      horizontalPush: sourceExercises.horizontalPush,
      verticalPush: sourceExercises.verticalPush,
      horizontalPull: sourceExercises.horizontalPull,
      verticalPull: sourceExercises.verticalPull,
      squat: sourceExercises.squat,
      hinge: sourceExercises.hinge,
      core: sourceExercises.core,
    })
    .from(sourceExercises)
    .where(inArray(sourceExercises.equipment, equipmentNames));

  return rows;
}
