import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExercisePickerDialog } from "./exercise-picker-dialog";
import { Button } from "@/components/ui/button";
import type { PickerExercise } from "@/app/(app)/workouts/[id]/edit/actions";

const searchExercisesForPicker = vi.fn<(q: string) => Promise<PickerExercise[]>>();

vi.mock("@/app/(app)/workouts/[id]/edit/actions", () => ({
  searchExercisesForPicker: (q: string) => searchExercisesForPicker(q),
}));

function candidate(name: string): PickerExercise {
  return {
    exerciseId: `EX-${name}`,
    name,
    thumbnailUrl: null,
    primaryMuscle: "Chest",
    equipment: "Barbell",
  };
}

function renderPicker(onSelect = vi.fn().mockResolvedValue(undefined)) {
  render(
    <ExercisePickerDialog
      trigger={<Button>Add exercise</Button>}
      title="Add an exercise"
      onSelect={onSelect}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Add exercise" }));
  return onSelect;
}

describe("ExercisePickerDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchExercisesForPicker.mockResolvedValue([]);
  });

  it("prompts for a search before anything has been typed", async () => {
    renderPicker();
    expect(await screen.findByText("Search the library")).toBeInTheDocument();
  });

  // Unhappy path: a search that finds nothing must say so, and say what was
  // searched for — not leave an unexplained blank list.
  it("names the failed search when nothing matches", async () => {
    renderPicker();
    await screen.findByText("Search the library");

    fireEvent.change(screen.getByPlaceholderText("Search exercises…"), {
      target: { value: "zzzz" },
    });

    expect(await screen.findByText("No exercises match that search")).toBeInTheDocument();
    expect(screen.getByText(/“zzzz”/)).toBeInTheDocument();
  });

  it("passes the picked exercise to the caller", async () => {
    searchExercisesForPicker.mockResolvedValue([candidate("Bench Press")]);
    const onSelect = renderPicker();

    fireEvent.change(screen.getByPlaceholderText("Search exercises…"), {
      target: { value: "bench" },
    });

    fireEvent.click(await screen.findByRole("button", { name: /Bench Press/ }));
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith("EX-Bench Press"));
  });
});
