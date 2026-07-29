import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const updateProfileAction = vi.fn();
vi.mock("@/app/(app)/profile/actions", () => ({
  updateProfileAction: (...args: unknown[]) => updateProfileAction(...args),
}));

import { ProfileEditor } from "./profile-editor";

function renderEditor() {
  return render(
    <ProfileEditor profileId="p1" currentLevel="Beginner" currentGoal="General" />
  );
}

describe("ProfileEditor", () => {
  beforeEach(() => {
    updateProfileAction.mockReset();
  });

  it("exposes the level and goal choices as radio groups with the current value checked", () => {
    renderEditor();

    const levels = screen.getByRole("radiogroup", { name: "Experience level" });
    expect(within(levels, "Beginner").getAttribute("aria-checked")).toBe("true");
    expect(within(levels, "Advanced").getAttribute("aria-checked")).toBe("false");

    const goals = screen.getByRole("radiogroup", { name: "Primary training goal" });
    expect(within(goals, "General").getAttribute("aria-checked")).toBe("true");
  });

  it("keeps Save disabled until something actually changes", () => {
    renderEditor();

    const save = screen.getByRole("button", { name: /save changes/i });
    expect(save).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: "Advanced" }));
    expect(save).toBeEnabled();
  });

  it("reverting a change back to its original value disables Save again", () => {
    renderEditor();
    const save = screen.getByRole("button", { name: /save changes/i });

    fireEvent.click(screen.getByRole("radio", { name: "Advanced" }));
    expect(save).toBeEnabled();

    fireEvent.click(screen.getByRole("radio", { name: "Beginner" }));
    expect(save).toBeDisabled();
  });

  // Unhappy path: the server action rejects, and the reason has to survive.
  it("surfaces the server's error rather than reporting success", async () => {
    updateProfileAction.mockResolvedValue({ success: false, error: "Profile not found" });
    renderEditor();

    fireEvent.click(screen.getByRole("radio", { name: "Advanced" }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("Profile not found")).toBeInTheDocument();
    expect(screen.queryByText(/updated successfully/i)).toBeNull();
  });

  // Unhappy path: the action throws outright rather than returning a result.
  it("does not leave the button spinning when the action throws", async () => {
    updateProfileAction.mockRejectedValue(new Error("network down"));
    renderEditor();

    fireEvent.click(screen.getByRole("radio", { name: "Advanced" }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(
      await screen.findByText("An error occurred while updating your profile")
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled()
    );
  });
});

/** Scope a radio lookup to one group — "Beginner" appears in both prose and chips. */
function within(group: HTMLElement, name: string): HTMLElement {
  const match = [...group.querySelectorAll<HTMLElement>('[role="radio"]')].find(
    (el) => el.textContent?.trim() === name
  );
  if (!match) throw new Error(`no radio named ${name}`);
  return match;
}
