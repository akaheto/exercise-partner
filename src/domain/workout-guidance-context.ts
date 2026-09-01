/**
 * Which experience level and training goal govern a workout's exercise
 * prescription (sets/reps/rest) and coaching cues.
 *
 * A workout generated with a specific level/goal keeps that choice for
 * itself — "generate this one harder than usual" should stay harder even
 * after the profile's own default level changes later, not silently drift
 * back to whatever the profile currently says. A workout with no stored
 * level/goal (built manually, imported from the Workout Library, or
 * duplicated before this existed) falls back to the profile's current
 * values, matching the app's original behavior.
 */

export interface WorkoutGuidanceSource {
  experienceLevel: string | null;
  trainingGoal: string | null;
}

export interface ProfileGuidanceSource {
  experienceLevel: string;
  trainingGoal: string;
}

export interface GuidanceContext {
  userLevel: string;
  userGoal: string;
}

const DEFAULT_LEVEL = "Beginner";
const DEFAULT_GOAL = "General";

export function resolveGuidanceContext(
  workout: WorkoutGuidanceSource,
  profile: ProfileGuidanceSource | null,
): GuidanceContext {
  return {
    userLevel: workout.experienceLevel ?? profile?.experienceLevel ?? DEFAULT_LEVEL,
    userGoal: workout.trainingGoal ?? profile?.trainingGoal ?? DEFAULT_GOAL,
  };
}
