export const GOALS = ["strength", "hypertrophy", "endurance", "general"] as const;
export type Goal = (typeof GOALS)[number];

export const FOCUS_AREAS = ["full_body", "upper_body", "lower_body", "push", "pull", "core"] as const;
export type Focus = (typeof FOCUS_AREAS)[number];

export const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const DURATION_OPTIONS = [20, 30, 40, 50, 60] as const;

/** The subset of a source_exercises row the generator needs to reason about.
 * Deliberately narrow — the algorithm should not depend on display-only
 * fields (thumbnails, instructions, etc). */
export interface GeneratorCandidate {
  exerciseId: string;
  name: string;
  primaryMuscle: string | null;
  mechanics: string | null; // "Compound" | "Isolation"
  experienceLevel: string | null; // "Beginner" | "Intermediate" | "Advanced" | null
  bodyRegion: string | null; // "Upper Body" | "Lower Body" | "Core / Trunk" | null
  horizontalPush: boolean;
  verticalPush: boolean;
  horizontalPull: boolean;
  verticalPull: boolean;
  squat: boolean;
  hinge: boolean;
  core: boolean;
}

export interface GeneratorInput {
  goal: Goal;
  durationMinutes: number;
  focus: Focus;
  experienceLevel: ExperienceLevel;
  /** Already filtered to equipment the profile has access to. */
  candidates: GeneratorCandidate[];
}

export interface GeneratedItem {
  exerciseId: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
}

export interface GeneratorResult {
  items: GeneratedItem[];
  estimatedMinutes: number;
  warnings: string[];
}
