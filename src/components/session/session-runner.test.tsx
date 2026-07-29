import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionRunner } from "./session-runner";
import type { SessionStep } from "@/domain/session-flow";

const logSet = vi.fn();
const deleteLastSet = vi.fn();
const abandonSession = vi.fn();

vi.mock("@/app/session/actions", () => ({
  logSet: (...args: unknown[]) => logSet(...args),
  deleteLastSet: (...args: unknown[]) => deleteLastSet(...args),
  abandonSession: (...args: unknown[]) => abandonSession(...args),
}));

function step(overrides: Partial<SessionStep> = {}): SessionStep {
  return {
    blockId: 1,
    itemId: 11,
    exerciseId: "EX-0001",
    exerciseName: "Barbell Bench Press",
    exerciseThumbnail: null,
    exercisePrimaryMuscle: "Chest",
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    restSeconds: 60,
    notes: null,
    ...overrides,
  };
}

function renderRunner({
  nextSetNumber = 1,
  defaultWeightUnit = "kg" as "kg" | "lb",
  stepOverrides = {},
}: {
  nextSetNumber?: number;
  defaultWeightUnit?: "kg" | "lb";
  stepOverrides?: Partial<SessionStep>;
} = {}) {
  return render(
    <SessionRunner
      sessionId="SESSION-1"
      workoutName="Upper Body Workout"
      steps={[step(stepOverrides)]}
      currentStepIndex={0}
      nextSetNumber={nextSetNumber}
      exercise={null}
      defaultWeightUnit={defaultWeightUnit}
    />,
  );
}

const weightField = () => screen.getByRole("textbox", { name: "Weight" });
const repsField = () => screen.getByRole("textbox", { name: "Reps" });

function typeAndCommit(field: HTMLElement, value: string) {
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
}

describe("SessionRunner set logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logSet.mockResolvedValue(undefined);
    deleteLastSet.mockResolvedValue(undefined);
    abandonSession.mockResolvedValue(undefined);
  });

  it("logs a weight and reps typed directly into the fields", async () => {
    renderRunner();

    typeAndCommit(weightField(), "60");
    typeAndCommit(repsField(), "10");
    fireEvent.click(screen.getByRole("button", { name: "Log set 1" }));

    await waitFor(() => expect(logSet).toHaveBeenCalledTimes(1));
    expect(logSet).toHaveBeenCalledWith("SESSION-1", {
      exerciseId: "EX-0001",
      setNumber: 1,
      weight: 60,
      weightUnit: "kg",
      reps: 10,
      notes: null,
    });
  });

  it("steps weight by the plate increment for the active unit and reps by one", async () => {
    renderRunner({ defaultWeightUnit: "kg" });

    fireEvent.click(screen.getByRole("button", { name: "Increase Weight" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase Weight" }));
    expect(weightField()).toHaveValue("5");

    fireEvent.click(screen.getByRole("button", { name: "Increase Reps" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase Reps" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase Reps" }));
    expect(repsField()).toHaveValue("3");

    fireEvent.click(screen.getByRole("button", { name: "Log set 1" }));
    await waitFor(() => expect(logSet).toHaveBeenCalledTimes(1));
    expect(logSet.mock.calls[0][1]).toMatchObject({ weight: 5, weightUnit: "kg", reps: 3 });
  });

  it("switches the step to 5 when the unit is switched to lb", async () => {
    renderRunner({ defaultWeightUnit: "kg" });

    fireEvent.click(screen.getByRole("button", { name: /Weight unit is kg/ }));
    fireEvent.click(screen.getByRole("button", { name: "Increase Weight" }));
    expect(weightField()).toHaveValue("5");

    fireEvent.click(screen.getByRole("button", { name: "Log set 1" }));
    await waitFor(() => expect(logSet).toHaveBeenCalledTimes(1));
    expect(logSet.mock.calls[0][1]).toMatchObject({ weight: 5, weightUnit: "lb" });
  });

  it("never steps weight or reps below zero", () => {
    renderRunner();

    typeAndCommit(weightField(), "2.5");
    fireEvent.click(screen.getByRole("button", { name: "Decrease Weight" }));
    expect(weightField()).toHaveValue("0");
    expect(screen.getByRole("button", { name: "Decrease Weight" })).toBeDisabled();
  });

  // Unhappy path: a bodyweight set logs nothing rather than a unit with no
  // weight attached to it.
  it("logs nulls, and no unit, when nothing is entered", async () => {
    renderRunner({ defaultWeightUnit: "lb" });

    fireEvent.click(screen.getByRole("button", { name: "Log set 1" }));

    await waitFor(() => expect(logSet).toHaveBeenCalledTimes(1));
    expect(logSet.mock.calls[0][1]).toMatchObject({ weight: null, weightUnit: null, reps: null });
  });

  // Unhappy path: the old bare inputs sent Number("abc") — NaN — straight at
  // a numeric column.
  it("keeps the last good weight when unparseable text is typed", async () => {
    renderRunner();

    typeAndCommit(weightField(), "60");
    typeAndCommit(weightField(), "sixty");
    expect(weightField()).toHaveValue("60");

    fireEvent.click(screen.getByRole("button", { name: "Log set 1" }));
    await waitFor(() => expect(logSet).toHaveBeenCalledTimes(1));
    expect(logSet.mock.calls[0][1]).toMatchObject({ weight: 60 });
  });

  it("carries the weight over to the next set but clears the reps", async () => {
    renderRunner({ stepOverrides: { restSeconds: 0 } });

    typeAndCommit(weightField(), "60");
    typeAndCommit(repsField(), "10");
    fireEvent.click(screen.getByRole("button", { name: "Log set 1" }));

    await waitFor(() => expect(repsField()).toHaveValue(""));
    expect(weightField()).toHaveValue("60");
  });

  it("shows the rest timer after a logged set and lets it be skipped", async () => {
    renderRunner();

    fireEvent.click(screen.getByRole("button", { name: "Log set 1" }));

    const timer = await screen.findByRole("timer");
    expect(timer).toHaveTextContent("1:00");
    // Mono + tabular so the digits don't jitter as the countdown ticks.
    expect(timer.className).toContain("text-timer");

    fireEvent.click(screen.getByRole("button", { name: "Skip rest" }));
    await waitFor(() => expect(screen.queryByRole("timer")).toBeNull());
    expect(screen.getByRole("button", { name: "Log set 1" })).toBeInTheDocument();
  });
});

describe("SessionRunner undo and exit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logSet.mockResolvedValue(undefined);
    deleteLastSet.mockResolvedValue(undefined);
    abandonSession.mockResolvedValue(undefined);
  });

  it("offers undo only once a set has been logged", () => {
    renderRunner({ nextSetNumber: 1 });
    expect(screen.queryByRole("button", { name: "Undo last set" })).toBeNull();
  });

  it("deletes the last set for this exercise on undo", async () => {
    renderRunner({ nextSetNumber: 2 });

    fireEvent.click(screen.getByRole("button", { name: "Undo last set" }));
    await waitFor(() => expect(deleteLastSet).toHaveBeenCalledWith("SESSION-1", "EX-0001"));
  });

  it("does not end the session until the exit is confirmed", async () => {
    renderRunner();

    fireEvent.click(screen.getByRole("button", { name: "End workout" }));
    expect(await screen.findByText("End this workout?")).toBeInTheDocument();
    expect(abandonSession).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "End workout" }));
    await waitFor(() => expect(abandonSession).toHaveBeenCalledWith("SESSION-1"));
  });

  // Unhappy path: backing out of the exit must leave the session running.
  it("keeps the session running when the exit is dismissed", async () => {
    renderRunner();

    fireEvent.click(screen.getByRole("button", { name: "End workout" }));
    await screen.findByText("End this workout?");
    fireEvent.click(screen.getByRole("button", { name: "Keep going" }));

    await waitFor(() => expect(screen.queryByText("End this workout?")).toBeNull());
    expect(abandonSession).not.toHaveBeenCalled();
  });
});

describe("SessionRunner touch targets", () => {
  beforeEach(() => vi.clearAllMocks());

  // VISUAL_STYLE_GUIDE.docx: nothing interactive under 44px, and Workout
  // Mode primaries at 56px.
  it("sizes every control for one-handed mid-set use", () => {
    renderRunner({ nextSetNumber: 2 });

    for (const name of ["Log set 2"]) {
      expect(screen.getByRole("button", { name }).className).toMatch(/\bh-14\b/);
    }

    for (const name of ["Increase Weight", "Decrease Weight", "Increase Reps", "Decrease Reps"]) {
      expect(screen.getByRole("button", { name }).className).toMatch(/\bsize-14\b/);
    }

    for (const field of [weightField(), repsField()]) {
      expect(field.className).toMatch(/\bh-14\b/);
      // The digits are the interface — 28px mono, not the 18px input default.
      expect(field.className).toContain("text-metric");
    }

    // 44px minimum, not the 36px dense-row size.
    for (const name of ["Undo last set", "End workout"]) {
      expect(screen.getByRole("button", { name }).className).toMatch(/\b(h-11|size-11)\b/);
      expect(screen.getByRole("button", { name }).className).not.toMatch(/\b(h-9|size-9)\b/);
    }
    expect(screen.getByRole("button", { name: /Weight unit is/ }).className).toMatch(/\bh-11\b/);
  });
});
