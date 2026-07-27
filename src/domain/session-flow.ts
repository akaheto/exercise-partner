import type { WorkoutForEdit } from "@/db/queries/workouts";

/**
 * One exercise to guide the user through in Workout Mode. Flattened from the
 * workout snapshot's blocks in position order — including superset/circuit
 * blocks, whose exercises are stepped through sequentially (all of exercise
 * A's sets, then all of exercise B's) rather than interleaved round-robin.
 * Documented simplification; see PROJECT_PLAN.docx section 4.
 */
export interface SessionStep {
  blockId: number;
  itemId: number;
  exerciseId: string;
  exerciseName: string;
  exerciseThumbnail: string | null;
  exercisePrimaryMuscle: string | null;
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  restSeconds: number | null;
  notes: string | null;
}

export function buildSessionSteps(snapshot: Pick<WorkoutForEdit, "blocks">): SessionStep[] {
  const steps: SessionStep[] = [];
  for (const block of snapshot.blocks) {
    for (const item of block.items) {
      steps.push({
        blockId: block.id,
        itemId: item.id,
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName,
        exerciseThumbnail: item.exerciseThumbnail,
        exercisePrimaryMuscle: item.exercisePrimaryMuscle,
        sets: item.sets,
        repsMin: item.repsMin,
        repsMax: item.repsMax,
        restSeconds: item.restSeconds ?? block.restSeconds,
        notes: item.notes,
      });
    }
  }
  return steps;
}

export interface LoggedSetRecord {
  exerciseId: string;
}

export interface SessionProgress {
  /** Index into `steps`, or `steps.length` once every step is fully logged. */
  currentStepIndex: number;
  /** The set number (1-based) the user should log next for the current step. */
  nextSetNumber: number;
  isComplete: boolean;
}

/**
 * Derives "where the user is" in a session from the sets already logged,
 * rather than a stored cursor — consistent with history being immutable and
 * reconstructible. Sets are matched to steps in logged order, so this stays
 * correct even if the same exercise appears in two different blocks (each
 * occurrence claims its own logged sets in sequence, oldest first).
 */
export function computeSessionProgress(steps: SessionStep[], loggedSets: LoggedSetRecord[]): SessionProgress {
  const totalLoggedByExercise = new Map<string, number>();
  for (const s of loggedSets) {
    totalLoggedByExercise.set(s.exerciseId, (totalLoggedByExercise.get(s.exerciseId) ?? 0) + 1);
  }

  const consumedByExercise = new Map<string, number>();
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const consumed = consumedByExercise.get(step.exerciseId) ?? 0;
    const available = (totalLoggedByExercise.get(step.exerciseId) ?? 0) - consumed;
    if (available < step.sets) {
      return { currentStepIndex: i, nextSetNumber: available + 1, isComplete: false };
    }
    consumedByExercise.set(step.exerciseId, consumed + step.sets);
  }

  return { currentStepIndex: steps.length, nextSetNumber: 1, isComplete: true };
}
