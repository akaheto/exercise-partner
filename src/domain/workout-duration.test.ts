import { describe, expect, it } from "vitest";
import {
  DEFAULT_REST_SECONDS,
  TRANSITION_SECONDS_PER_BLOCK,
  WORK_SECONDS_PER_SET,
  estimateSelectionMinutes,
  estimateWorkoutMinutes,
} from "./workout-duration";

describe("estimateWorkoutMinutes", () => {
  it("returns 0 for an empty workout", () => {
    expect(estimateWorkoutMinutes([])).toBe(0);
  });

  it("returns 0 for a block with no items", () => {
    expect(estimateWorkoutMinutes([{ restSeconds: 60, items: [] }])).toBe(0);
  });

  it("computes a single-exercise block: work + rest*sets + transition", () => {
    const seconds = 3 * WORK_SECONDS_PER_SET + 3 * 90 + TRANSITION_SECONDS_PER_BLOCK;
    expect(estimateWorkoutMinutes([{ restSeconds: 90, items: [{ sets: 3 }] }])).toBe(Math.ceil(seconds / 60));
  });

  it("falls back to the default rest when a block doesn't specify one", () => {
    const withDefault = estimateWorkoutMinutes([{ restSeconds: null, items: [{ sets: 3 }] }]);
    const withExplicitDefault = estimateWorkoutMinutes([
      { restSeconds: DEFAULT_REST_SECONDS, items: [{ sets: 3 }] },
    ]);
    expect(withDefault).toBe(withExplicitDefault);
  });

  it("sums work across all items in a grouped block, but rests once per round", () => {
    // Superset of two 3-set exercises: 6 sets of work, but only 3 rest periods.
    const grouped = estimateWorkoutMinutes([
      { restSeconds: 60, items: [{ sets: 3 }, { sets: 3 }] },
    ]);
    const seconds = 6 * WORK_SECONDS_PER_SET + 3 * 60 + TRANSITION_SECONDS_PER_BLOCK;
    expect(grouped).toBe(Math.ceil(seconds / 60));
  });

  it("uses the higher set count as the round count when items in a block differ", () => {
    const seconds = (2 + 4) * WORK_SECONDS_PER_SET + 4 * 60 + TRANSITION_SECONDS_PER_BLOCK;
    expect(estimateWorkoutMinutes([{ restSeconds: 60, items: [{ sets: 2 }, { sets: 4 }] }])).toBe(
      Math.ceil(seconds / 60),
    );
  });

  it("adds a transition cost per block, so more blocks means more total time for the same sets", () => {
    const oneBlock = estimateWorkoutMinutes([{ restSeconds: 60, items: [{ sets: 3 }, { sets: 3 }] }]);
    const twoBlocks = estimateWorkoutMinutes([
      { restSeconds: 60, items: [{ sets: 3 }] },
      { restSeconds: 60, items: [{ sets: 3 }] },
    ]);
    expect(twoBlocks).toBeGreaterThan(oneBlock);
  });

  it("sums across multiple blocks", () => {
    const a = estimateWorkoutMinutes([{ restSeconds: 60, items: [{ sets: 3 }] }]);
    const combined = estimateWorkoutMinutes([
      { restSeconds: 60, items: [{ sets: 3 }] },
      { restSeconds: 60, items: [{ sets: 3 }] },
    ]);
    expect(combined).toBe(a * 2);
  });

  it("rounds up rather than down, so short workouts don't estimate to 0 minutes", () => {
    expect(estimateWorkoutMinutes([{ restSeconds: 0, items: [{ sets: 1 }] }])).toBeGreaterThan(0);
  });
});

describe("estimateSelectionMinutes", () => {
  it("returns 0 for no exercises selected", () => {
    expect(estimateSelectionMinutes(0)).toBe(0);
  });

  it("uses a flat per-exercise transition instead of a rest-per-round calculation", () => {
    // 3 sets * 40s work + 60s flat transition, no rest-per-round added.
    const seconds = 3 * WORK_SECONDS_PER_SET + TRANSITION_SECONDS_PER_BLOCK;
    expect(estimateSelectionMinutes(1)).toBe(Math.ceil(seconds / 60));
  });

  it("scales linearly with exercise count", () => {
    const one = estimateSelectionMinutes(1);
    const four = estimateSelectionMinutes(4);
    expect(four).toBe(one * 4);
  });

  it("respects a custom sets-per-exercise value", () => {
    const threeSets = estimateSelectionMinutes(1, 3);
    const fiveSets = estimateSelectionMinutes(1, 5);
    expect(fiveSets).toBeGreaterThan(threeSets);
  });

  it("treats a negative count the same as zero rather than throwing", () => {
    expect(estimateSelectionMinutes(-1)).toBe(0);
  });
});
