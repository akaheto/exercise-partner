import { describe, expect, it } from "vitest";
import type { WorkoutForEdit } from "@/db/queries/workouts";
import { buildSessionSteps, computeSessionProgress } from "./session-flow";

function item(overrides: Partial<WorkoutForEdit["blocks"][number]["items"][number]> = {}) {
  return {
    id: 1,
    position: 0,
    exerciseId: "EX-0001",
    exerciseName: "Bench Press",
    exerciseThumbnail: null,
    exercisePrimaryMuscle: "Chest",
    exerciseSecondaryMuscles: null,
    exerciseBodyRegion: "Upper Body",
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    restSeconds: null,
    notes: null,
    ...overrides,
  };
}

describe("buildSessionSteps", () => {
  it("returns one step per item, in block/item position order", () => {
    const snapshot: Pick<WorkoutForEdit, "blocks"> = {
      blocks: [
        { id: 1, position: 0, kind: "single", restSeconds: 90, items: [item({ id: 1, exerciseId: "EX-0001" })] },
        {
          id: 2,
          position: 1,
          kind: "superset",
          restSeconds: 60,
          items: [item({ id: 2, exerciseId: "EX-0002" }), item({ id: 3, exerciseId: "EX-0003" })],
        },
      ],
    };

    const steps = buildSessionSteps(snapshot);
    expect(steps.map((s) => s.exerciseId)).toEqual(["EX-0001", "EX-0002", "EX-0003"]);
  });

  it("falls back to the block's rest when the item has none", () => {
    const snapshot: Pick<WorkoutForEdit, "blocks"> = {
      blocks: [{ id: 1, position: 0, kind: "single", restSeconds: 90, items: [item({ restSeconds: null })] }],
    };
    expect(buildSessionSteps(snapshot)[0].restSeconds).toBe(90);
  });

  it("prefers the item's own rest over the block's", () => {
    const snapshot: Pick<WorkoutForEdit, "blocks"> = {
      blocks: [{ id: 1, position: 0, kind: "single", restSeconds: 90, items: [item({ restSeconds: 45 })] }],
    };
    expect(buildSessionSteps(snapshot)[0].restSeconds).toBe(45);
  });

  it("returns an empty list for a workout with no blocks", () => {
    expect(buildSessionSteps({ blocks: [] })).toEqual([]);
  });
});

const stepsFixture = buildSessionSteps({
  blocks: [
    { id: 1, position: 0, kind: "single", restSeconds: 60, items: [item({ id: 1, exerciseId: "EX-0001", sets: 2 })] },
    { id: 2, position: 1, kind: "single", restSeconds: 60, items: [item({ id: 2, exerciseId: "EX-0002", sets: 3 })] },
  ],
});

describe("computeSessionProgress", () => {
  it("starts at the first step, first set, when nothing has been logged", () => {
    expect(computeSessionProgress(stepsFixture, [])).toEqual({
      currentStepIndex: 0,
      nextSetNumber: 1,
      isComplete: false,
    });
  });

  it("advances to the next set of the same exercise", () => {
    const progress = computeSessionProgress(stepsFixture, [{ exerciseId: "EX-0001" }]);
    expect(progress).toEqual({ currentStepIndex: 0, nextSetNumber: 2, isComplete: false });
  });

  it("moves to the next step once the current exercise's sets are all logged", () => {
    const progress = computeSessionProgress(stepsFixture, [
      { exerciseId: "EX-0001" },
      { exerciseId: "EX-0001" },
    ]);
    expect(progress).toEqual({ currentStepIndex: 1, nextSetNumber: 1, isComplete: false });
  });

  it("reports complete once every step's sets are logged", () => {
    const progress = computeSessionProgress(stepsFixture, [
      { exerciseId: "EX-0001" },
      { exerciseId: "EX-0001" },
      { exerciseId: "EX-0002" },
      { exerciseId: "EX-0002" },
      { exerciseId: "EX-0002" },
    ]);
    expect(progress).toEqual({ currentStepIndex: 2, nextSetNumber: 1, isComplete: true });
  });

  it("an empty workout is immediately complete", () => {
    expect(computeSessionProgress([], [])).toEqual({ currentStepIndex: 0, nextSetNumber: 1, isComplete: true });
  });

  it("attributes logged sets to duplicate-exercise steps in order, oldest first", () => {
    const dupeSteps = buildSessionSteps({
      blocks: [
        { id: 1, position: 0, kind: "single", restSeconds: 60, items: [item({ id: 1, exerciseId: "EX-0001", sets: 1 })] },
        { id: 2, position: 1, kind: "single", restSeconds: 60, items: [item({ id: 2, exerciseId: "EX-0001", sets: 1 })] },
      ],
    });
    // One set logged for EX-0001 so far: it belongs to the first occurrence,
    // so the second occurrence hasn't started yet.
    const progress = computeSessionProgress(dupeSteps, [{ exerciseId: "EX-0001" }]);
    expect(progress).toEqual({ currentStepIndex: 1, nextSetNumber: 1, isComplete: false });
  });
});
