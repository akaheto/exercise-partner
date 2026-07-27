/**
 * Deterministic, rule-based workout assessment — muscles worked, a weight/rep
 * selection tip inferred from the rep ranges actually prescribed, and a
 * recovery tip based on which muscle groups were hit. No LLM call; see
 * ENHANCEMENTS.docx for an AI-powered version of this as a deferred idea.
 * Pure and unit-tested; no I/O.
 */

export interface AssessmentExerciseInput {
  primaryMuscle: string | null;
  secondaryMuscles: string[];
  bodyRegion: string | null;
  repsMin: number | null;
  repsMax: number | null;
}

export type RepProfile = "strength" | "hypertrophy" | "endurance" | "unknown";

export interface WorkoutAssessment {
  /** Unique primary muscles, most-frequently-hit first. */
  primaryMuscles: string[];
  /** Unique secondary muscles not already counted as primary. */
  secondaryMuscles: string[];
  /** Known body regions (Upper Body / Lower Body / Core / Trunk) this workout doesn't touch at all. */
  missingRegions: string[];
  repProfile: RepProfile;
  weightRepTip: string;
  recoveryTip: string;
}

const KNOWN_REGIONS = ["Upper Body", "Lower Body", "Core / Trunk"];

const LOWER_BODY_MUSCLES = new Set(["Quads", "Hamstrings", "Glutes", "Calves", "Adductors", "Abductors", "Hip Flexors", "IT Band"]);
const CORE_MUSCLES = new Set(["Abs", "Obliques", "Lower Back"]);

const WEIGHT_REP_TIPS: Record<RepProfile, string> = {
  strength: "This workout is in a low-rep range. Pick a weight where the last 1–2 reps of each set are genuinely hard while your form stays solid — if you comfortably clear the top of the rep range, add weight next time.",
  hypertrophy: "This workout is in a moderate-rep range. Choose a weight that brings you close to failure by the last couple of reps in your target range, and increase it once you can hit the top of the range for every set.",
  endurance: "This workout is in a higher-rep range. Use a lighter weight that lets you complete every rep with control — the final reps should feel challenging, not maximal.",
  unknown: "Set your rep ranges on each exercise to get a weight-selection tip tailored to this workout.",
};

function recoveryTipFor(primaryMuscles: string[]): string {
  const lowerCount = primaryMuscles.filter((m) => LOWER_BODY_MUSCLES.has(m)).length;
  const coreCount = primaryMuscles.filter((m) => CORE_MUSCLES.has(m)).length;
  const upperCount = primaryMuscles.length - lowerCount - coreCount;

  if (lowerCount >= upperCount && lowerCount >= coreCount && lowerCount > 0) {
    return "This is a lower-body-heavy session — give those muscle groups roughly 48–72 hours before training them hard again. Some soreness over the next day or two is normal; sharp or worsening pain isn't.";
  }
  if (upperCount > 0) {
    return "Give the muscles you trained here roughly 48 hours before working them hard again. Prioritise sleep and protein intake in that window — that's when the actual adaptation happens, not during the workout itself.";
  }
  if (coreCount > 0) {
    return "Core muscles recover relatively quickly, but still benefit from at least a day off between focused sessions.";
  }
  return "Add exercises to get a recovery tip based on the muscles this workout trains.";
}

/**
 * Classified from the average rep-range midpoint across items with a
 * recorded range — a genuine reflection of what's actually prescribed, not a
 * fixed label, so editing rep ranges changes the assessment.
 */
function classifyRepProfile(exercises: AssessmentExerciseInput[]): RepProfile {
  const midpoints = exercises
    .filter((e) => e.repsMin !== null && e.repsMax !== null)
    .map((e) => (e.repsMin! + e.repsMax!) / 2);
  if (midpoints.length === 0) return "unknown";

  const average = midpoints.reduce((a, b) => a + b, 0) / midpoints.length;
  if (average <= 6) return "strength";
  if (average <= 15) return "hypertrophy";
  return "endurance";
}

export function assessWorkout(exercises: AssessmentExerciseInput[]): WorkoutAssessment {
  const primaryCounts = new Map<string, number>();
  const secondarySet = new Set<string>();
  const regionsHit = new Set<string>();

  for (const ex of exercises) {
    if (ex.primaryMuscle) primaryCounts.set(ex.primaryMuscle, (primaryCounts.get(ex.primaryMuscle) ?? 0) + 1);
    for (const m of ex.secondaryMuscles) secondarySet.add(m);
    if (ex.bodyRegion) regionsHit.add(ex.bodyRegion);
  }

  const primaryMuscles = [...primaryCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([m]) => m);
  const secondaryMuscles = [...secondarySet].filter((m) => !primaryCounts.has(m)).sort();
  const missingRegions = exercises.length === 0 ? [] : KNOWN_REGIONS.filter((r) => !regionsHit.has(r));
  const repProfile = classifyRepProfile(exercises);

  return {
    primaryMuscles,
    secondaryMuscles,
    missingRegions,
    repProfile,
    weightRepTip: WEIGHT_REP_TIPS[repProfile],
    recoveryTip: recoveryTipFor(primaryMuscles),
  };
}
