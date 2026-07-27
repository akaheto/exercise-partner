import type { ExperienceLevel, Focus, Goal, GeneratorCandidate } from "./types";

/** Movement patterns to prioritise covering with one compound exercise each,
 * before filling remaining budget with accessory work. This is where "push/
 * pull balance" and "movement-pattern coverage" (Epic F3) come from. */
export const ANCHOR_PATTERNS: Record<Focus, (keyof GeneratorCandidate)[]> = {
  full_body: ["squat", "hinge", "horizontalPush", "horizontalPull", "verticalPush", "verticalPull", "core"],
  upper_body: ["horizontalPush", "verticalPush", "horizontalPull", "verticalPull"],
  lower_body: ["squat", "hinge"],
  push: ["horizontalPush", "verticalPush"],
  pull: ["horizontalPull", "verticalPull"],
  core: ["core"],
};

const UPPER_BODY_MUSCLES = new Set([
  "Chest",
  "Shoulders",
  "Triceps",
  "Biceps",
  "Lats",
  "Upper Back",
  "Middle Back",
  "Traps",
  "Forearms",
]);
const LOWER_BODY_MUSCLES = new Set(["Quads", "Hamstrings", "Glutes", "Calves", "Adductors", "Abductors", "Hip Flexors", "IT Band"]);
const PUSH_MUSCLES = new Set(["Chest", "Shoulders", "Triceps"]);
const PULL_MUSCLES = new Set(["Lats", "Upper Back", "Middle Back", "Traps", "Biceps", "Forearms"]);
const CORE_MUSCLES = new Set(["Abs", "Obliques", "Lower Back"]);

/** Whether a candidate is plausibly relevant to a focus area — used to build
 * the working pool before pattern-based anchor selection. Broader than the
 * anchor patterns on purpose, so accessory work has somewhere to draw from. */
export function matchesFocus(candidate: GeneratorCandidate, focus: Focus): boolean {
  const muscle = candidate.primaryMuscle ?? "";
  switch (focus) {
    case "full_body":
      return true;
    case "upper_body":
      return candidate.bodyRegion === "Upper Body" || UPPER_BODY_MUSCLES.has(muscle);
    case "lower_body":
      return candidate.bodyRegion === "Lower Body" || LOWER_BODY_MUSCLES.has(muscle);
    case "push":
      return candidate.horizontalPush || candidate.verticalPush || PUSH_MUSCLES.has(muscle);
    case "pull":
      return candidate.horizontalPull || candidate.verticalPull || PULL_MUSCLES.has(muscle);
    case "core":
      return candidate.core || candidate.bodyRegion === "Core / Trunk" || CORE_MUSCLES.has(muscle);
    default:
      return true;
  }
}

export interface Prescription {
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
}

/** Not measured values — a reasonable starting point per goal, editable
 * afterwards in the builder like everything else the generator produces. */
export const GOAL_PRESCRIPTIONS: Record<Goal, Prescription> = {
  strength: { sets: 4, repsMin: 3, repsMax: 5, restSeconds: 150 },
  hypertrophy: { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 75 },
  endurance: { sets: 3, repsMin: 15, repsMax: 20, restSeconds: 45 },
  general: { sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 },
};

const EXPERIENCE_RANK: Record<ExperienceLevel, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };

/** A candidate with no experience level on record is treated as accessible
 * to everyone, rather than excluded for missing data. */
export function isWithinExperience(candidate: GeneratorCandidate, level: ExperienceLevel): boolean {
  const candidateLevel = candidate.experienceLevel as ExperienceLevel | null;
  if (!candidateLevel || !(candidateLevel in EXPERIENCE_RANK)) return true;
  return EXPERIENCE_RANK[candidateLevel] <= EXPERIENCE_RANK[level];
}

/** Target exercise count from a duration in minutes. Not a measured value —
 * roughly one exercise per 8 minutes, clamped to a sane range. Refined
 * afterwards by the duration-fitting loop in generate.ts against the actual
 * per-exercise time model (src/domain/workout-duration.ts). */
export function targetExerciseCount(durationMinutes: number): number {
  return Math.min(10, Math.max(3, Math.round(durationMinutes / 8)));
}
