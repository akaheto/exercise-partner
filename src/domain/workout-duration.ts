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
