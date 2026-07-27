/**
 * Estimated workout duration. A model, not a measurement — calibrate against
 * real recorded session durations once history exists (see TECHNICAL_SPEC.docx
 * "Known Limitations"). Pure and unit-tested; no I/O.
 */

/** Assumed active time per set (lift + setup), in seconds. */
export const WORK_SECONDS_PER_SET = 40;

/** Assumed time to move to a new exercise/adjust equipment, per block. */
export const TRANSITION_SECONDS_PER_BLOCK = 60;

/** Rest between rounds when a block doesn't specify its own rest. */
export const DEFAULT_REST_SECONDS = 60;

export interface DurationItem {
  sets: number;
}

export interface DurationBlock {
  restSeconds: number | null;
  items: DurationItem[];
}

/**
 * A block's "rounds" is its highest set count — grouped exercises (superset/
 * circuit) are assumed to be performed together for that many rounds, with
 * rest taken once per round rather than once per exercise.
 */
function blockSeconds(block: DurationBlock): number {
  if (block.items.length === 0) return 0;
  const rounds = Math.max(...block.items.map((i) => i.sets));
  const workSeconds = block.items.reduce((sum, item) => sum + item.sets * WORK_SECONDS_PER_SET, 0);
  const restSeconds = rounds * (block.restSeconds ?? DEFAULT_REST_SECONDS);
  return workSeconds + restSeconds + TRANSITION_SECONDS_PER_BLOCK;
}

/** Total estimated duration in whole minutes (rounded up — better to slightly overestimate). */
export function estimateWorkoutMinutes(blocks: DurationBlock[]): number {
  if (blocks.length === 0) return 0;
  const totalSeconds = blocks.reduce((sum, block) => sum + blockSeconds(block), 0);
  return Math.ceil(totalSeconds / 60);
}

/** The default prescription applied to a manually-added exercise before the
 * user customises it (see Epic E's addExerciseAsNewBlock) — used here so the
 * quick preview and the eventual saved workout agree on what "a set" means. */
export const DEFAULT_PRESCRIPTION_SETS = 3;

/**
 * Quick running estimate for the Exercise Library's multi-select picker,
 * before exercises are grouped into blocks or given real prescriptions. Each
 * exercise gets a flat transition cost instead of a per-round rest period —
 * deliberately simpler than the full builder estimate, since nothing has
 * been configured yet. Reuses estimateWorkoutMinutes by giving every
 * exercise its own zero-rest block: blockSeconds' fixed
 * TRANSITION_SECONDS_PER_BLOCK becomes exactly that flat per-exercise cost.
 */
export function estimateSelectionMinutes(exerciseCount: number, setsPerExercise: number = DEFAULT_PRESCRIPTION_SETS): number {
  if (exerciseCount <= 0) return 0;
  const blocks: DurationBlock[] = Array.from({ length: exerciseCount }, () => ({
    restSeconds: 0,
    items: [{ sets: setsPerExercise }],
  }));
  return estimateWorkoutMinutes(blocks);
}
