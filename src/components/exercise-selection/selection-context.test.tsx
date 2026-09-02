import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import {
  ExerciseSelectionProvider,
  useClearExerciseSelection,
  useIsExerciseSelected,
  useSelectedExercises,
  useToggleExerciseSelection,
} from "./selection-context";

/** Renders `exerciseId`'s selected state and calls `onCommit` after every
 * commit (never mutates anything itself — the caller decides what a commit
 * means to it). The render-isolation test below counts commits per
 * exerciseId this way, not just the resulting value, to prove *which*
 * consumers actually re-rendered on a toggle. */
function Probe({ exerciseId, onCommit }: { exerciseId: string; onCommit?: () => void }) {
  const selected = useIsExerciseSelected(exerciseId);
  const toggle = useToggleExerciseSelection();

  useEffect(() => {
    onCommit?.();
  });

  return (
    <button
      type="button"
      aria-label={`toggle-${exerciseId}`}
      aria-pressed={selected}
      onClick={() => toggle({ exerciseId, name: exerciseId })}
    >
      {selected ? "selected" : "unselected"}
    </button>
  );
}

function SelectionSummary() {
  const selected = useSelectedExercises();
  const clear = useClearExerciseSelection();
  return (
    <div>
      <span data-testid="count">{selected.length}</span>
      <button type="button" onClick={clear}>
        clear
      </button>
    </div>
  );
}

describe("selection-context", () => {
  it("toggles a single exercise on and off", () => {
    render(
      <ExerciseSelectionProvider>
        <Probe exerciseId="EX-1" />
      </ExerciseSelectionProvider>,
    );

    const btn = screen.getByRole("button", { name: "toggle-EX-1" });
    expect(btn).toHaveAttribute("aria-pressed", "false");

    act(() => btn.click());
    expect(btn).toHaveAttribute("aria-pressed", "true");

    act(() => btn.click());
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("tracks multiple selections independently and reports the count", () => {
    render(
      <ExerciseSelectionProvider>
        <Probe exerciseId="EX-1" />
        <Probe exerciseId="EX-2" />
        <SelectionSummary />
      </ExerciseSelectionProvider>,
    );

    act(() => screen.getByRole("button", { name: "toggle-EX-1" }).click());
    expect(screen.getByTestId("count")).toHaveTextContent("1");

    act(() => screen.getByRole("button", { name: "toggle-EX-2" }).click());
    expect(screen.getByTestId("count")).toHaveTextContent("2");
  });

  it("clear deselects everything", () => {
    render(
      <ExerciseSelectionProvider>
        <Probe exerciseId="EX-1" />
        <Probe exerciseId="EX-2" />
        <SelectionSummary />
      </ExerciseSelectionProvider>,
    );

    act(() => screen.getByRole("button", { name: "toggle-EX-1" }).click());
    act(() => screen.getByRole("button", { name: "toggle-EX-2" }).click());
    act(() => screen.getByRole("button", { name: "clear" }).click());

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByRole("button", { name: "toggle-EX-1" })).toHaveAttribute("aria-pressed", "false");
  });

  // QA-audit item 14: this is the actual regression test for the bug found
  // by profiling — the old Context-value-based implementation re-rendered
  // every consumer on every toggle. Asserting on render *counts*, not just
  // on the resulting selected value, is the only way to catch that class of
  // bug; a value-only assertion would pass even with the old broken code.
  it("re-renders only the toggled exercise's own consumer, not unrelated ones", () => {
    const renderCounts: Record<string, number> = {};
    const countFor = (id: string) => () => {
      renderCounts[id] = (renderCounts[id] ?? 0) + 1;
    };
    render(
      <ExerciseSelectionProvider>
        <Probe exerciseId="EX-1" onCommit={countFor("EX-1")} />
        <Probe exerciseId="EX-2" onCommit={countFor("EX-2")} />
        <Probe exerciseId="EX-3" onCommit={countFor("EX-3")} />
      </ExerciseSelectionProvider>,
    );

    const rendersBefore = { ...renderCounts };

    act(() => screen.getByRole("button", { name: "toggle-EX-2" }).click());

    expect(renderCounts["EX-2"]).toBe(rendersBefore["EX-2"] + 1);
    // EX-1 and EX-3 never subscribed to EX-2's state, so a change to it must
    // not cost them a render at all.
    expect(renderCounts["EX-1"]).toBe(rendersBefore["EX-1"]);
    expect(renderCounts["EX-3"]).toBe(rendersBefore["EX-3"]);
  });

  it("throws outside the provider — a clear failure instead of a silent null store", () => {
    function Bare() {
      useIsExerciseSelected("EX-1");
      return null;
    }
    expect(() => render(<Bare />)).toThrow(/must be used within ExerciseSelectionProvider/);
  });
});
