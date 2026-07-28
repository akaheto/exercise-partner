import {
  exerciseGuidanceOverrides,
  guidancePatterns,
} from "../db/schema/app";
import { sourceExercises } from "../db/schema/source";
import { eq, inArray } from "drizzle-orm";

/**
 * Exercise guidance joined with patterns.
 * Enables the app to fetch: exercise → pattern → prescribed sets/reps/RPE/tempo/breathing.
 */
export interface ExerciseGuidanceWithPattern {
  exerciseId: string;
  exerciseName: string;
  patternId: string;
  experienceLevel: string;
  trainingGoal: string;
  recommendedSets: number;
  recommendedRepsMin: number;
  recommendedRepsMax: number;
  targetRpe: number;
  tempo: string;
  breathingCue: string;
  formCue: string;
  // Exercise-specific overrides (all optional)
  regressionTier1ExerciseId: string | null;
  regressionTier1Note: string | null;
  regressionTier2ExerciseId: string | null;
  regressionTier2Note: string | null;
  regressionTier3ExerciseId: string | null;
  regressionTier3Note: string | null;
  alternative1ExerciseId: string | null;
  alternative1Note: string | null;
  alternative2ExerciseId: string | null;
  alternative2Note: string | null;
  requiredMobility: string | null;
  contraindicatedFor: string | null;
  minimumExperienceLevel: string | null;
  exerciseSpecificFormCue: string | null;
  beginnerSafetyCue: string | null;
}

export interface ExerciseGuidanceRow {
  exerciseId: string;
  exerciseName: string;
  patternId: string;
  experienceLevel: string;
  trainingGoal: string;
  recommendedSets: number;
  recommendedRepsMin: number;
  recommendedRepsMax: number;
  targetRpe: number;
  tempo: string;
  breathingCue: string;
  formCue: string;
  regressionTier1ExerciseId: string | null;
  regressionTier1Note: string | null;
  regressionTier2ExerciseId: string | null;
  regressionTier2Note: string | null;
  regressionTier3ExerciseId: string | null;
  regressionTier3Note: string | null;
  alternative1ExerciseId: string | null;
  alternative1Note: string | null;
  alternative2ExerciseId: string | null;
  alternative2Note: string | null;
  requiredMobility: string | null;
  contraindicatedFor: string | null;
  minimumExperienceLevel: string | null;
  exerciseSpecificFormCue: string | null;
  beginnerSafetyCue: string | null;
}

/**
 * Fetch guidance for a single exercise.
 * Joins exercise_guidance_overrides → guidance_patterns to get all prescription details.
 *
 * Usage:
 *   const guidance = await getExerciseGuidance("EX-0001");
 *   console.log(guidance.recommendedSets, guidance.recommendedRepsMin, guidance.tempo);
 */
export async function getExerciseGuidance(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any, // Database client from drizzle
  exerciseId: string
): Promise<ExerciseGuidanceRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .select({
      exerciseId: sourceExercises.exerciseId,
      exerciseName: sourceExercises.name,
      patternId: exerciseGuidanceOverrides.patternId,
      experienceLevel: guidancePatterns.experienceLevel,
      trainingGoal: guidancePatterns.trainingGoal,
      recommendedSets: guidancePatterns.recommendedSets,
      recommendedRepsMin: guidancePatterns.recommendedRepsMin,
      recommendedRepsMax: guidancePatterns.recommendedRepsMax,
      targetRpe: guidancePatterns.targetRpe,
      tempo: guidancePatterns.tempo,
      breathingCue: guidancePatterns.breathingCue,
      formCue: guidancePatterns.formCue,
      regressionTier1ExerciseId: exerciseGuidanceOverrides.regressionTier1ExerciseId,
      regressionTier1Note: exerciseGuidanceOverrides.regressionTier1Note,
      regressionTier2ExerciseId: exerciseGuidanceOverrides.regressionTier2ExerciseId,
      regressionTier2Note: exerciseGuidanceOverrides.regressionTier2Note,
      regressionTier3ExerciseId: exerciseGuidanceOverrides.regressionTier3ExerciseId,
      regressionTier3Note: exerciseGuidanceOverrides.regressionTier3Note,
      alternative1ExerciseId: exerciseGuidanceOverrides.alternative1ExerciseId,
      alternative1Note: exerciseGuidanceOverrides.alternative1Note,
      alternative2ExerciseId: exerciseGuidanceOverrides.alternative2ExerciseId,
      alternative2Note: exerciseGuidanceOverrides.alternative2Note,
      requiredMobility: exerciseGuidanceOverrides.requiredMobility,
      contraindicatedFor: exerciseGuidanceOverrides.contraindicatedFor,
      minimumExperienceLevel: exerciseGuidanceOverrides.minimumExperienceLevel,
      exerciseSpecificFormCue: exerciseGuidanceOverrides.exerciseSpecificFormCue,
      beginnerSafetyCue: exerciseGuidanceOverrides.beginnerSafetyCue,
    })
    .from(sourceExercises)
    .innerJoin(
      exerciseGuidanceOverrides,
      eq(sourceExercises.exerciseId, exerciseGuidanceOverrides.exerciseId)
    )
    .innerJoin(
      guidancePatterns,
      eq(exerciseGuidanceOverrides.patternId, guidancePatterns.id)
    )
    .where(eq(sourceExercises.exerciseId, exerciseId));

  return result[0] || null;
}

/**
 * Fetch guidance for multiple exercises.
 * Returns one row per exercise (pattern + guidance combined).
 */
export async function getExercisesGuidance(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any, // Database client from drizzle
  exerciseIds: string[]
): Promise<ExerciseGuidanceRow[]> {
  if (exerciseIds.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .select({
      exerciseId: sourceExercises.exerciseId,
      exerciseName: sourceExercises.name,
      patternId: exerciseGuidanceOverrides.patternId,
      experienceLevel: guidancePatterns.experienceLevel,
      trainingGoal: guidancePatterns.trainingGoal,
      recommendedSets: guidancePatterns.recommendedSets,
      recommendedRepsMin: guidancePatterns.recommendedRepsMin,
      recommendedRepsMax: guidancePatterns.recommendedRepsMax,
      targetRpe: guidancePatterns.targetRpe,
      tempo: guidancePatterns.tempo,
      breathingCue: guidancePatterns.breathingCue,
      formCue: guidancePatterns.formCue,
      regressionTier1ExerciseId: exerciseGuidanceOverrides.regressionTier1ExerciseId,
      regressionTier1Note: exerciseGuidanceOverrides.regressionTier1Note,
      regressionTier2ExerciseId: exerciseGuidanceOverrides.regressionTier2ExerciseId,
      regressionTier2Note: exerciseGuidanceOverrides.regressionTier2Note,
      regressionTier3ExerciseId: exerciseGuidanceOverrides.regressionTier3ExerciseId,
      regressionTier3Note: exerciseGuidanceOverrides.regressionTier3Note,
      alternative1ExerciseId: exerciseGuidanceOverrides.alternative1ExerciseId,
      alternative1Note: exerciseGuidanceOverrides.alternative1Note,
      alternative2ExerciseId: exerciseGuidanceOverrides.alternative2ExerciseId,
      alternative2Note: exerciseGuidanceOverrides.alternative2Note,
      requiredMobility: exerciseGuidanceOverrides.requiredMobility,
      contraindicatedFor: exerciseGuidanceOverrides.contraindicatedFor,
      minimumExperienceLevel: exerciseGuidanceOverrides.minimumExperienceLevel,
      exerciseSpecificFormCue: exerciseGuidanceOverrides.exerciseSpecificFormCue,
      beginnerSafetyCue: exerciseGuidanceOverrides.beginnerSafetyCue,
    })
    .from(sourceExercises)
    .innerJoin(
      exerciseGuidanceOverrides,
      eq(sourceExercises.exerciseId, exerciseGuidanceOverrides.exerciseId)
    )
    .innerJoin(
      guidancePatterns,
      eq(exerciseGuidanceOverrides.patternId, guidancePatterns.id)
    )
    .where(inArray(sourceExercises.exerciseId, exerciseIds));

  return result;
}
