import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlockList } from "./block-list";
import type { WorkoutBlockForEdit } from "@/db/queries/workouts";

vi.mock("@/app/(app)/workouts/[id]/edit/actions", () => ({
  reorderBlocks: vi.fn(),
  removeItem: vi.fn(),
  substituteExercise: vi.fn(),
  updateItemPrescription: vi.fn(),
  addExerciseToBlock: vi.fn(),
  updateBlockKind: vi.fn(),
  updateBlockRest: vi.fn(),
  searchExercisesForPicker: vi.fn().mockResolvedValue([]),
}));

function block(id: number, name: string): WorkoutBlockForEdit {
  return {
    id,
    position: id,
    kind: "single",
    restSeconds: 90,
    items: [
      {
        id: id * 10,
        position: 0,
        exerciseId: `EX-000${id}`,
        exerciseName: name,
        exerciseThumbnail: null,
        exercisePrimaryMuscle: "Chest",
        exerciseSecondaryMuscles: null,
        exerciseBodyRegion: "Upper",
        sets: 3,
        repsMin: 8,
        repsMax: 12,
        restSeconds: 90,
        notes: null,
      },
    ],
  };
}

function renderList(blocks: WorkoutBlockForEdit[]) {
  return render(
    <BlockList
      workoutId="w1"
      blocks={blocks}
      substitutionCandidates={new Map()}
      guidanceMap={new Map()}
      userLevel="Beginner"
      userGoal="General"
    />,
  );
}

describe("BlockList", () => {
  it("names the actual state when the workout has no blocks", () => {
    renderList([]);

    expect(screen.getByText("No exercises in this workout")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Drag to reorder" })).toBeNull();
  });

  it("gives every block a drag handle at the 44px touch minimum", () => {
    renderList([block(1, "Bench Press"), block(2, "Barbell Row")]);

    const handles = screen.getAllByRole("button", { name: "Drag to reorder" });
    expect(handles).toHaveLength(2);
    for (const handle of handles) {
      // size-11 is 44px; the previous p-1 + size-4 handle was ~24px.
      expect(handle.className).toMatch(/\bsize-11\b/);
      // dnd-kit's pointer listeners need touch-action: none to work on touch.
      expect(handle.className).toMatch(/\btouch-none\b/);
      // The sortable listeners are still wired to the handle itself.
      expect(handle).toHaveAttribute("aria-roledescription", "sortable");
    }
  });

  // Regression: without min-w-0 the flex item defaults to min-width:auto, so a
  // long exercise name widened the card past the viewport at 375px instead of
  // truncating. Caught in the browser at 375px, guarded here.
  it("lets the block column shrink below its content width", () => {
    const { container } = renderList([block(1, "Alternating Standing Dumbbell Shoulder Press")]);

    const column = container.querySelector(".flex-1");
    expect(column).not.toBeNull();
    expect(column!.className).toMatch(/\bmin-w-0\b/);
  });

  it("renders blocks in the order it is given", () => {
    renderList([block(1, "Bench Press"), block(2, "Barbell Row")]);

    const names = screen
      .getAllByRole("link", { name: /Bench Press|Barbell Row/ })
      .map((el) => el.textContent);
    expect(names).toEqual(["Bench Press", "Barbell Row"]);
  });
});
