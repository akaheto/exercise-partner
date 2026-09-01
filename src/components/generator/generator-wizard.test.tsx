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

function renderWizard(
  initialExperienceLevel: "Beginner" | "Intermediate" | "Advanced" = "Beginner",
  initialGoal: "strength" | "hypertrophy" | "endurance" | "general" = "general",
) {
  return render(
    <GeneratorWizard
      equipmentOptions={EQUIPMENT}
      initialHaveIds={["eq-1"]}
      initialExperienceLevel={initialExperienceLevel}
      initialGoal={initialGoal}
    />,
  );
}

function goToExperienceStep() {
  fireEvent.click(screen.getByRole("button", { name: /General fitness/ }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
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

  // Regression: the Experience step used to always default to "Intermediate"
  // regardless of the active profile's own experience level, unlike the
  // Equipment step (already seeded from initialHaveIds). A Beginner profile
  // would silently get an Intermediate-difficulty workout unless they
  // noticed and corrected it on this one screen.
  it("defaults the Experience step to the profile's own level", () => {
    renderWizard("Beginner");
    goToExperienceStep();
    expect(screen.getByText("Step 4 of 5: Experience")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Beginner" })).toHaveAttribute("aria-pressed", "true");
  });

  it("defaults to a different level when the profile is Advanced", () => {
    renderWizard("Advanced");
    goToExperienceStep();
    expect(screen.getByRole("button", { name: "Advanced" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Beginner" })).toHaveAttribute("aria-pressed", "false");
  });

  // Same class of bug as the Experience default, on the Goal step: it also
  // used to be hardcoded to "general" regardless of the profile's own
  // trainingGoal.
  it("defaults the Goal step to the profile's own training goal", () => {
    renderWizard("Beginner", "strength");
    expect(screen.getByText("Step 1 of 5: Goal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /General strength/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /General fitness/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
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

  // Unhappy path: submitting with zero equipment selected silently produces
  // an empty candidate pool (src/domain/generator/generate.ts) — this warns
  // on the step itself, before the round trip to the server.
  it("warns when no equipment is selected on the Equipment step", () => {
    render(
      <GeneratorWizard
        equipmentOptions={EQUIPMENT}
        initialHaveIds={[]}
        initialExperienceLevel="Beginner"
        initialGoal="general"
      />,
    );
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    }
    expect(screen.getByText(/Nothing selected yet/)).toBeInTheDocument();
  });

  it("does not warn once at least one equipment item is selected", () => {
    renderWizard(); // pre-selects eq-1 via initialHaveIds
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    }
    expect(screen.queryByText(/Nothing selected yet/)).toBeNull();
  });

  it("shows the warning again after deselecting the only equipment item", () => {
    renderWizard();
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Barbell" }));
    expect(screen.getByText(/Nothing selected yet/)).toBeInTheDocument();
  });
});
