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

describe("SessionRunner set logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logSet.mockResolvedValue(undefined);
    deleteLastSet.mockResolvedValue(undefined);
    abandonSession.mockResolvedValue(undefined);
  });

  it("logs weight and reps through toggle buttons", async () => {
    renderRunner({ defaultWeightUnit: "kg" });

    const weightBtn = screen.getByRole("button", { name: /Weight:/ });
    const repsBtn = screen.getByRole("button", { name: /Reps:/ });

    fireEvent.click(weightBtn);
    fireEvent.click(weightBtn);
    fireEvent.click(repsBtn);
    fireEvent.click(repsBtn);
    fireEvent.click(repsBtn);

    fireEvent.click(screen.getByRole("button", { name: "Log set 1" }));

    await waitFor(() => expect(logSet).toHaveBeenCalledTimes(1));
    expect(logSet.mock.calls[0][1]).toMatchObject({
      exerciseId: "EX-0001",
      setNumber: 1,
      weight: 5,
      weightUnit: "kg",
      reps: 10,
      notes: null,
    });
  });

  it("cycles weight through kg increments when the unit is kg", async () => {
    renderRunner({ defaultWeightUnit: "kg" });

    const weightBtn = screen.getByRole("button", { name: /Weight:/ });

    expect(weightBtn).toHaveTextContent("—");

    fireEvent.click(weightBtn);
    expect(weightBtn).toHaveTextContent("2.5kg");

    fireEvent.click(weightBtn);
    expect(weightBtn).toHaveTextContent("5kg");

    fireEvent.click(weightBtn);
    expect(weightBtn).toHaveTextContent("7.5kg");
  });

  it("cycles weight through lb increments when the unit is lb", async () => {
    renderRunner({ defaultWeightUnit: "lb" });

    const weightBtn = screen.getByRole("button", { name: /Weight:/ });

    fireEvent.click(weightBtn);
    expect(weightBtn).toHaveTextContent("5lb");

    fireEvent.click(weightBtn);
    expect(weightBtn).toHaveTextContent("10lb");

    fireEvent.click(weightBtn);
    expect(weightBtn).toHaveTextContent("15lb");
  });

  it("cycles reps through the rep range", async () => {
    renderRunner();

    const repsBtn = screen.getByRole("button", { name: /Reps:/ });

    expect(repsBtn).toHaveTextContent("—");

    fireEvent.click(repsBtn);
    expect(repsBtn).toHaveTextContent("8");

    fireEvent.click(repsBtn);
    expect(repsBtn).toHaveTextContent("9");

    fireEvent.click(repsBtn);
    expect(repsBtn).toHaveTextContent("10");
  });

  it("cycles reps to Max after reaching the max in the range", async () => {
    renderRunner();

    const repsBtn = screen.getByRole("button", { name: /Reps:/ });

    for (let i = 0; i < 5; i++) {
      fireEvent.click(repsBtn);
    }

    expect(repsBtn).toHaveTextContent("12");

    fireEvent.click(repsBtn);
    expect(repsBtn).toHaveTextContent("Max");

    fireEvent.click(repsBtn);
    expect(repsBtn).toHaveTextContent("8");
  });

  it("switches weight unit and maintains toggle cycling", async () => {
    renderRunner({ defaultWeightUnit: "kg" });

    const unitBtn = screen.getByRole("button", { name: /Weight unit is kg/ });
    const weightBtn = screen.getByRole("button", { name: /Weight:/ });

    fireEvent.click(weightBtn);
    expect(weightBtn).toHaveTextContent("2.5kg");

    fireEvent.click(unitBtn);

    fireEvent.click(weightBtn);
    expect(weightBtn).toHaveTextContent("5lb");
  });

  it("logs nulls, and no unit, when nothing is entered", async () => {
    renderRunner({ defaultWeightUnit: "lb" });

    fireEvent.click(screen.getByRole("button", { name: "Log set 1" }));

    await waitFor(() => expect(logSet).toHaveBeenCalledTimes(1));
    expect(logSet.mock.calls[0][1]).toMatchObject({ weight: null, weightUnit: null, reps: null });
  });

  it("carries the weight over to the next set but clears the reps", async () => {
    renderRunner({ stepOverrides: { restSeconds: 0 } });

    let weightBtn = screen.getByRole("button", { name: /Weight:/ });
    let repsBtn = screen.getByRole("button", { name: /Reps:/ });

    fireEvent.click(weightBtn);
    fireEvent.click(repsBtn);
    fireEvent.click(repsBtn);

    fireEvent.click(screen.getByRole("button", { name: "Log set 1" }));

    await waitFor(() => {
      repsBtn = screen.getByRole("button", { name: /Reps:/ });
      weightBtn = screen.getAllByRole("button").find((btn) => btn.textContent.includes("Weight:")) as HTMLElement;
      expect(repsBtn).toHaveTextContent("—");
      expect(weightBtn).toHaveTextContent("2.5kg");
    });
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

    const weightToggle = screen.getAllByRole("button").find((btn) => btn.textContent.includes("Weight:"));
    const repsToggle = screen.getByRole("button", { name: /Reps:/ });
    expect(weightToggle?.className).toMatch(/\b(size-14|h-14)\b/);
    expect(repsToggle.className).toMatch(/\b(size-14|h-14)\b/);

    // 44px minimum, not the 36px dense-row size.
    for (const name of ["Undo last set", "End workout"]) {
      expect(screen.getByRole("button", { name }).className).toMatch(/\b(h-11|size-11)\b/);
      expect(screen.getByRole("button", { name }).className).not.toMatch(/\b(h-9|size-9)\b/);
    }
    expect(screen.getByRole("button", { name: /Weight unit is/ }).className).toMatch(/\bh-11\b/);
  });
});
