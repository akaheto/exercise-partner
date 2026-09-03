import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkoutCard } from "./workout-card";
import type { WorkoutSummary } from "@/db/queries/workouts";

const archiveWorkout = vi.fn();
const unarchiveWorkout = vi.fn();
const duplicateWorkout = vi.fn();
const deleteWorkoutPermanently = vi.fn();
const startSession = vi.fn();

vi.mock("@/app/(app)/workouts/actions", () => ({
  archiveWorkout: (...args: unknown[]) => archiveWorkout(...args),
  unarchiveWorkout: (...args: unknown[]) => unarchiveWorkout(...args),
  duplicateWorkout: (...args: unknown[]) => duplicateWorkout(...args),
  deleteWorkoutPermanently: (...args: unknown[]) => deleteWorkoutPermanently(...args),
}));

vi.mock("@/app/session/actions", () => ({
  startSession: (...args: unknown[]) => startSession(...args),
}));

function workout(overrides: Partial<WorkoutSummary> = {}): WorkoutSummary {
  return {
    id: "w1",
    name: "Upper Body Workout",
    description: "Push and pull",
    archivedAt: null,
    updatedAt: new Date("2026-07-01"),
    exerciseCount: 6,
    estimatedMinutes: 42,
    sourceProgramId: null,
    sourceProgramName: null,
    ...overrides,
  };
}

describe("WorkoutCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not archive until the user confirms", async () => {
    render(<WorkoutCard workout={workout()} archived={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    expect(archiveWorkout).not.toHaveBeenCalled();

    // The dialog names the object, so the user knows which one they hit.
    expect(await screen.findByText("Archive “Upper Body Workout”?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    await waitFor(() => expect(archiveWorkout).toHaveBeenCalledWith("w1"));
  });

  // Unhappy path: backing out of the dialog must leave the workout alone.
  it("leaves the workout alone when the confirmation is cancelled", async () => {
    render(<WorkoutCard workout={workout()} archived={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    await screen.findByText("Archive “Upper Body Workout”?");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(screen.queryByText("Archive “Upper Body Workout”?")).toBeNull(),
    );
    expect(archiveWorkout).not.toHaveBeenCalled();
  });

  // Restoring is additive, so it stays a one-click action with no dialog.
  it("restores an archived workout without a confirmation", async () => {
    render(<WorkoutCard workout={workout({ archivedAt: new Date() })} archived />);

    expect(screen.queryByRole("button", { name: "Archive" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    await waitFor(() => expect(unarchiveWorkout).toHaveBeenCalledWith("w1"));
  });

  it("does not delete until the user confirms", async () => {
    render(<WorkoutCard workout={workout({ archivedAt: new Date() })} archived />);

    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    expect(deleteWorkoutPermanently).not.toHaveBeenCalled();

    expect(await screen.findByText("Permanently delete “Upper Body Workout”?")).toBeInTheDocument();

    // Both the trigger and the dialog's own confirm button share the name.
    const confirmButtons = screen.getAllByRole("button", { name: "Delete permanently" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);
    await waitFor(() => expect(deleteWorkoutPermanently).toHaveBeenCalledWith("w1"));
  });

  // Unhappy path: only an archived workout gets a delete option at all —
  // the server action itself also refuses a non-archived one, but the
  // control shouldn't even be reachable from a live workout's card.
  it("never shows Delete permanently on a workout that isn't archived", () => {
    render(<WorkoutCard workout={workout()} archived={false} />);
    expect(screen.queryByRole("button", { name: "Delete permanently" })).toBeNull();
  });

  it("hides Start on an archived workout and on an empty one", () => {
    const { unmount } = render(
      <WorkoutCard workout={workout({ archivedAt: new Date() })} archived />,
    );
    expect(screen.queryByRole("button", { name: "Start" })).toBeNull();
    unmount();

    render(<WorkoutCard workout={workout({ exerciseCount: 0 })} archived={false} />);
    expect(screen.queryByRole("button", { name: "Start" })).toBeNull();
  });

  it("keeps every action at the 44px touch minimum", () => {
    render(<WorkoutCard workout={workout()} archived={false} />);

    for (const name of ["Start", "Duplicate", "Archive"]) {
      const button = screen.getByRole("button", { name });
      // `h-11` is Button size="default"; size="sm" would render `h-9`.
      expect(button.className).toMatch(/\bh-11\b/);
      expect(button.className).not.toMatch(/\bh-9\b/);
    }
  });
});
