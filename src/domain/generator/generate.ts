import { estimateWorkoutMinutes } from "@/domain/workout-duration";
import { ANCHOR_PATTERNS, GOAL_PRESCRIPTIONS, isWithinExperience, matchesFocus, targetExerciseCount } from "./constants";
import type { GeneratedItem, GeneratorCandidate, GeneratorInput, GeneratorResult } from "./types";

const MAX_FIT_ITERATIONS = 6;
const OVER_BUDGET_TOLERANCE = 1.15;
const UNDER_BUDGET_TOLERANCE = 0.7;
const MIN_ITEMS = 2;

function sortedByName(candidates: GeneratorCandidate[]): GeneratorCandidate[] {
  return [...candidates].sort((a, b) => a.name.localeCompare(b.name));
}

/** Selects exercises: one compound anchor per relevant movement pattern
 * first (push/pull/squat/hinge/core balance — Epic F3), then accessory work
 * filling remaining budget, preferring muscles not yet covered so the
 * workout isn't redundantly stacked on one muscle group. */
function selectCandidates(pool: GeneratorCandidate[], focus: GeneratorInput["focus"], targetCount: number): GeneratorCandidate[] {
  const sorted = sortedByName(pool);
  const selected: GeneratorCandidate[] = [];
  const selectedIds = new Set<string>();
  const usedMuscles = new Set<string>();

  for (const pattern of ANCHOR_PATTERNS[focus]) {
    if (selected.length >= targetCount) break;
    const anchor =
      sorted.find(
        (c) => c[pattern] === true && c.mechanics === "Compound" && !usedMuscles.has(c.primaryMuscle ?? "") && !selectedIds.has(c.exerciseId),
      ) ?? sorted.find((c) => c[pattern] === true && !selectedIds.has(c.exerciseId));
    if (anchor) {
      selected.push(anchor);
      selectedIds.add(anchor.exerciseId);
      if (anchor.primaryMuscle) usedMuscles.add(anchor.primaryMuscle);
    }
  }

  // Fill remaining budget with accessory work, preferring muscle diversity.
  const remainingPool = sorted.filter((c) => !selectedIds.has(c.exerciseId));
  const diverse = remainingPool.filter((c) => !usedMuscles.has(c.primaryMuscle ?? ""));
  const rest = remainingPool.filter((c) => usedMuscles.has(c.primaryMuscle ?? ""));
  for (const candidate of [...diverse, ...rest]) {
    if (selected.length >= targetCount) break;
    selected.push(candidate);
    selectedIds.add(candidate.exerciseId);
    if (candidate.primaryMuscle) usedMuscles.add(candidate.primaryMuscle);
  }

  // Compound-first ordering (Epic F4), stable within each group.
  const compound = selected.filter((c) => c.mechanics === "Compound");
  const isolation = selected.filter((c) => c.mechanics !== "Compound");
  return [...compound, ...isolation];
}

function toGeneratedItems(candidates: GeneratorCandidate[], goal: GeneratorInput["goal"]): GeneratedItem[] {
  const p = GOAL_PRESCRIPTIONS[goal];
  return candidates.map((c) => ({
    exerciseId: c.exerciseId,
    name: c.name,
    sets: p.sets,
    repsMin: p.repsMin,
    repsMax: p.repsMax,
    restSeconds: p.restSeconds,
  }));
}

function estimateMinutesFor(items: GeneratedItem[]): number {
  return estimateWorkoutMinutes(items.map((i) => ({ restSeconds: i.restSeconds, items: [{ sets: i.sets }] })));
}

/**
 * Produces a workout from the questionnaire's answers and an already
 * equipment-filtered candidate pool. Pure — no I/O, no randomness, fully
 * deterministic for the same input (sorted by name at each step) so it's
 * directly unit-testable. See TECHNICAL_SPEC.docx for the algorithm's
 * documented tradeoffs.
 */
export function generateWorkout(input: GeneratorInput): GeneratorResult {
  const warnings: string[] = [];

  const eligible = input.candidates.filter((c) => isWithinExperience(c, input.experienceLevel));
  let pool = eligible.filter((c) => matchesFocus(c, input.focus));

  if (pool.length === 0 && eligible.length > 0) {
    warnings.push(`No exercises matched your focus with the equipment you have — used your full available pool instead.`);
    pool = eligible;
  }

  if (pool.length === 0) {
    warnings.push("No exercises are available for your equipment and experience level. Try adding more equipment.");
    return { items: [], estimatedMinutes: 0, warnings };
  }

  const desiredCount = targetExerciseCount(input.durationMinutes);
  const targetCount = Math.min(desiredCount, pool.length);
  let selected = selectCandidates(pool, input.focus, targetCount);
  let items = toGeneratedItems(selected, input.goal);
  let minutes = estimateMinutesFor(items);

  let iterations = 0;
  while (iterations < MAX_FIT_ITERATIONS) {
    iterations += 1;
    if (minutes > input.durationMinutes * OVER_BUDGET_TOLERANCE && selected.length > MIN_ITEMS) {
      selected = selected.slice(0, -1);
    } else if (minutes < input.durationMinutes * UNDER_BUDGET_TOLERANCE && selected.length < pool.length) {
      const next = selectCandidates(pool, input.focus, selected.length + 1);
      if (next.length === selected.length) break; // pool exhausted
      selected = next;
    } else {
      break;
    }
    items = toGeneratedItems(selected, input.goal);
    minutes = estimateMinutesFor(items);
  }

  if (selected.length < desiredCount) {
    warnings.push(`Only ${selected.length} suitable exercise${selected.length === 1 ? "" : "s"} available for your equipment — the workout may run shorter than requested.`);
  }

  return { items, estimatedMinutes: minutes, warnings };
}
