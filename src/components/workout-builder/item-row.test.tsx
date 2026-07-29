import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ItemRow } from "./item-row";
import type { WorkoutItemForEdit } from "@/db/queries/workouts";

const removeItem = vi.fn();
const substituteExercise = vi.fn();
const updateItemPrescription = vi.fn();
const searchExercisesForPicker = vi.fn().mockResolvedValue([]);

vi.mock("@/app/(app)/workouts/[id]/edit/actions", () => ({
  removeItem: (...args: unknown[]) => removeItem(...args),
  substituteExercise: (...args: unknown[]) => substituteExercise(...args),
  updateItemPrescription: (...args: unknown[]) => updateItemPrescription(...args),
  searchExercisesForPicker: (...args: unknown[]) => searchExercisesForPicker(...args),
}));

function item(overrides: Partial<WorkoutItemForEdit> = {}): WorkoutItemForEdit {
  return {
    id: 7,
    position: 0,
    exerciseId: "EX-0001",
    exerciseName: "Barbell Bench Press",
    exerciseThumbnail: null,
    exercisePrimaryMuscle: "Chest",
    exerciseSecondaryMuscles: null,
    exerciseBodyRegion: "Upper",
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    restSeconds: 90,
    notes: null,
    ...overrides,
  };
}

function renderRow(overrides: Partial<WorkoutItemForEdit> = {}) {
  return render(<ItemRow item={item(overrides)} substitutionCandidates={[]} />);
}

describe("ItemRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not remove the exercise until the user confirms", async () => {
    renderRow();

    fireEvent.click(screen.getByRole("button", { name: "Remove Barbell Bench Press" }));
    expect(removeItem).not.toHaveBeenCalled();

    expect(await screen.findByText("Remove “Barbell Bench Press”?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(removeItem).toHaveBeenCalledWith(7));
  });

  // Unhappy path: cancelling must not delete anything.
  it("keeps the exercise when the confirmation is cancelled", async () => {
    renderRow();

    fireEvent.click(screen.getByRole("button", { name: "Remove Barbell Bench Press" }));
    await screen.findByText("Remove “Barbell Bench Press”?");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(screen.queryByText("Remove “Barbell Bench Press”?")).toBeNull(),
    );
    expect(removeItem).not.toHaveBeenCalled();
  });

  // Unhappy path: a failing server action must not close the dialog and
  // silently swallow the reason.
  it("keeps the dialog open and shows why when removal fails", async () => {
    removeItem.mockRejectedValueOnce(new Error("Item not found"));
    renderRow();

    fireEvent.click(screen.getByRole("button", { name: "Remove Barbell Bench Press" }));
    await screen.findByText("Remove “Barbell Bench Press”?");
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(await screen.findByText("Item not found")).toBeInTheDocument();
    expect(screen.getByText("Remove “Barbell Bench Press”?")).toBeInTheDocument();
  });

  it("saves the prescription on blur without touching the other fields", async () => {
    renderRow();

    const sets = screen.getByLabelText(/Sets/);
    fireEvent.change(sets, { target: { value: "5" } });
    fireEvent.blur(sets);

    await waitFor(() => expect(updateItemPrescription).toHaveBeenCalledTimes(1));
    const [itemId, formData] = updateItemPrescription.mock.calls[0] as [number, FormData];
    expect(itemId).toBe(7);
    expect(formData.get("sets")).toBe("5");
    expect(formData.get("repsMin")).toBe("8");
    expect(formData.get("repsMax")).toBe("12");
    expect(formData.get("restSeconds")).toBe("90");
  });

  it("keeps the numeric inputs and icon buttons at the 44px touch minimum", () => {
    renderRow();

    // Input size="default" is h-11; the old dense h-9 is below the minimum.
    for (const label of [/Sets/, /Rest \(s\)/, "Notes"]) {
      const input = screen.getByLabelText(label as string | RegExp);
      expect(input.className).toMatch(/\bh-11\b/);
      expect(input.className).not.toMatch(/\bh-9\b/);
    }

    for (const name of ["Substitute Barbell Bench Press", "Remove Barbell Bench Press"]) {
      // Button size="icon" is size-11; size="icon-sm" would be size-9.
      expect(screen.getByRole("button", { name }).className).toMatch(/\bsize-11\b/);
    }
  });
});
