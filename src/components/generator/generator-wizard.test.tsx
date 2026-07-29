import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GeneratorWizard } from "./generator-wizard";
import type { GenerateWorkoutState } from "@/app/(app)/build/generate/actions";

const state: GenerateWorkoutState = {};

vi.mock("@/app/(app)/build/generate/actions", () => ({
  generateWorkoutAction: vi.fn(),
}));

// useActionState needs a real reducer-ish pair; the wizard only reads `state`
// and `isPending`, so a stubbed hook keeps the test on the step machine.
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useActionState: () => [state, vi.fn(), false] as const,
  };
});

const EQUIPMENT = [
  { equipmentId: "eq-1", name: "Barbell" },
  { equipmentId: "eq-2", name: "Dumbbell" },
];

function renderWizard() {
  return render(<GeneratorWizard equipmentOptions={EQUIPMENT} initialHaveIds={["eq-1"]} />);
}

describe("GeneratorWizard", () => {
  it("advances through steps and keeps the answer from the previous step", () => {
    renderWizard();

    expect(screen.getByText("Step 1 of 5: Goal")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Muscle gain/ }));
    expect(screen.getByRole("button", { name: /Muscle gain/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Step 2 of 5: Duration")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "40 min" }));

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Step 3 of 5: Focus")).toBeInTheDocument();

    // Stepping back must not reset what was already answered.
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("button", { name: "40 min" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("button", { name: /Muscle gain/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  // Unhappy path: there is nowhere to go back to from the first step.
  it("disables Back on the first step", () => {
    renderWizard();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  it("swaps Next for Generate on the last step", () => {
    renderWizard();

    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    }

    expect(screen.getByText("Step 5 of 5: Equipment")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
    expect(screen.getByRole("button", { name: /Generate workout/ })).toBeInTheDocument();
    // The profile's existing equipment is pre-selected.
    expect(screen.getByRole("button", { name: "Barbell" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Dumbbell" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("keeps every option card at the 44px touch minimum", () => {
    renderWizard();

    for (const option of screen.getAllByRole("button", { name: /strength|gain|endurance|fitness/i })) {
      expect(option.className).toMatch(/\bmin-h-11\b/);
    }
  });
});
