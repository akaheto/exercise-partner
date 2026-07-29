import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const createProfile = vi.fn();
const completeOnboarding = vi.fn();
const push = vi.fn();

vi.mock("@/app/(app)/profile/actions", () => ({
  createProfile: (...args: unknown[]) => createProfile(...args),
  completeOnboarding: (...args: unknown[]) => completeOnboarding(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { OnboardingFlow } from "./onboarding-flow";

async function advanceToStep2() {
  fireEvent.change(screen.getByLabelText("What's your name?"), {
    target: { value: "Ben" },
  });
  fireEvent.change(screen.getByLabelText("Choose a PIN"), { target: { value: "1234" } });
  fireEvent.click(screen.getByRole("button", { name: /next: your experience level/i }));
  await screen.findByText("Step 2 of 4");
}

async function advanceToStep3() {
  await advanceToStep2();
  fireEvent.click(screen.getByRole("button", { name: /Intermediate/ }));
  await screen.findByText("Step 3 of 4");
}

async function advanceToStep4() {
  await advanceToStep3();
  fireEvent.click(screen.getByRole("button", { name: /Hypertrophy/ }));
  await screen.findByText("Step 4 of 4");
}

describe("OnboardingFlow", () => {
  beforeEach(() => {
    createProfile.mockReset();
    completeOnboarding.mockReset();
    push.mockReset();
    createProfile.mockResolvedValue({});
  });

  it("starts on step 1 and does not call completeOnboarding until the last step is confirmed", () => {
    render(<OnboardingFlow />);
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    expect(completeOnboarding).not.toHaveBeenCalled();
  });

  it("walks name -> level -> goal -> summary, landing on the values actually chosen", async () => {
    completeOnboarding.mockResolvedValue({ success: true });
    render(<OnboardingFlow />);

    await advanceToStep4();

    expect(screen.getByText("Ben")).toBeInTheDocument();
    expect(screen.getByText("Intermediate")).toBeInTheDocument();
    expect(screen.getByText("Hypertrophy")).toBeInTheDocument();
  });

  // The bug this whole feature exists to fix: level/goal used to live only in
  // this component's React state and were never sent to the server at all.
  it("persists the chosen level and goal, then navigates to /exercises, only once step 4 is confirmed", async () => {
    completeOnboarding.mockResolvedValue({ success: true });
    render(<OnboardingFlow />);
    await advanceToStep4();

    expect(completeOnboarding).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /start using exercise partner/i }));

    await waitFor(() => expect(completeOnboarding).toHaveBeenCalledWith("Intermediate", "Hypertrophy"));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/exercises"));
  });

  // Unhappy path: the server rejects the save (e.g. the profile no longer
  // exists). The user must not be silently dropped on /exercises anyway.
  it("keeps the user on step 4 and shows the reason when completion fails", async () => {
    completeOnboarding.mockResolvedValue({ success: false, error: "No active profile to complete onboarding for" });
    render(<OnboardingFlow />);
    await advanceToStep4();

    fireEvent.click(screen.getByRole("button", { name: /start using exercise partner/i }));

    expect(
      await screen.findByText("No active profile to complete onboarding for"),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("Step 4 of 4")).toBeInTheDocument();
  });

  // Unhappy path: the action throws outright rather than returning a result.
  it("shows a fallback error and stops loading if completion throws", async () => {
    completeOnboarding.mockRejectedValue(new Error("network down"));
    render(<OnboardingFlow />);
    await advanceToStep4();

    const button = screen.getByRole("button", { name: /start using exercise partner/i });
    fireEvent.click(button);

    expect(await screen.findByText("Failed to save your profile")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /start using exercise partner/i })).toBeEnabled(),
    );
    expect(push).not.toHaveBeenCalled();
  });

  // Step 1 remounts fresh on Back (it isn't kept alive off-screen), so the
  // typed name/PIN are lost — a pre-existing minor quirk, not something this
  // change affects. Asserted here so a future refactor doesn't accidentally
  // "fix" it into different behaviour without anyone deciding to.
  it("Back returns to step 1, which remounts empty", async () => {
    render(<OnboardingFlow />);
    await advanceToStep2();

    fireEvent.click(screen.getByRole("button", { name: /back/i }));

    expect(await screen.findByText("Step 1 of 4")).toBeInTheDocument();
    expect(screen.getByLabelText("What's your name?")).toHaveValue("");
  });
});
