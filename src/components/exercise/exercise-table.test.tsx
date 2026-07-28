import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExerciseTable } from "./exercise-table";
import type { SourceExerciseRow } from "./types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

/** Only the columns the table renders matter here; the rest of the row is
 * filled in so the type stays honest. */
function row(overrides: Partial<SourceExerciseRow> = {}): SourceExerciseRow {
  return {
    exerciseId: "EX-0001",
    name: "Barbell Bench Press",
    url: null,
    videoAvailable: false,
    videoUrl: null,
    thumbnailUrl: null,
    primaryMuscle: "Chest",
    secondaryMuscles: null,
    stabilizerMuscles: null,
    equipment: "Barbell",
    exerciseType: "Strength",
    mechanics: "Compound",
    force: "Push",
    experienceLevel: "Beginner",
    startingPosition: null,
    rangeOfMotion: null,
    instructions: null,
    tips: null,
    commonMistakes: null,
    variationsRaw: null,
    alternativesRaw: null,
    progressionRaw: null,
    regressionRaw: null,
    imagesAvailable: false,
    numberOfImages: 0,
    gifAvailable: false,
    muscleGroupsTag: null,
    equipmentTagsTag: null,
    movementTagsTag: null,
    compoundIsolation: null,
    lastVerified: null,
    source: null,
    horizontalPush: false,
    verticalPush: false,
    horizontalPull: false,
    verticalPull: false,
    squat: false,
    hinge: false,
    carry: false,
    rotation: false,
    antiRotation: false,
    core: false,
    unilateralBilateral: null,
    bodyPosition: null,
    bodyRegion: null,
    singleJointMultiJoint: null,
    leftRightBoth: null,
    mobilityRequired: null,
    balanceRequired: null,
    derivedStatus: null,
    sourceRowHash: "hash",
    importedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("ExerciseTable", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("renders one row per exercise with its metadata columns", () => {
    render(<ExerciseTable exercises={[row(), row({ exerciseId: "EX-0002", name: "Deadlift" })]} />);

    expect(screen.getByRole("link", { name: "Barbell Bench Press" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Deadlift" })).toBeTruthy();
    expect(screen.getAllByText("Chest")).toHaveLength(2);
    expect(screen.getAllByText("Barbell")).toHaveLength(2);
  });

  it("navigates when a cell other than the name is clicked — the whole row is the target", () => {
    render(<ExerciseTable exercises={[row()]} />);

    fireEvent.click(screen.getByText("Strength"));

    expect(push).toHaveBeenCalledWith("/exercises/EX-0001");
  });

  it("keeps the name cell a real link so keyboard and open-in-new-tab still work", () => {
    render(<ExerciseTable exercises={[row()]} />);

    const link = screen.getByRole("link", { name: "Barbell Bench Press" });
    expect(link.getAttribute("href")).toBe("/exercises/EX-0001");
  });

  // Unhappy path: the anchor and the row handler both cover the name cell, so
  // clicking the link must navigate exactly once, not twice.
  it("does not double-navigate when the name link itself is clicked", () => {
    render(<ExerciseTable exercises={[row()]} />);

    fireEvent.click(screen.getByRole("link", { name: "Barbell Bench Press" }));

    expect(push).not.toHaveBeenCalled();
  });

  it("marks the video column only for exercises that have one", () => {
    render(
      <ExerciseTable
        exercises={[row({ videoAvailable: true }), row({ exerciseId: "EX-0002", name: "Deadlift" })]}
      />,
    );

    expect(screen.getAllByLabelText("Video available")).toHaveLength(1);
  });
});
