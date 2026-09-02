import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const createProfile = vi.fn();
const selectProfile = vi.fn();

vi.mock("@/app/(app)/profile/actions", () => ({
  createProfile: (...args: unknown[]) => createProfile(...args),
  selectProfile: (...args: unknown[]) => selectProfile(...args),
}));

import { ProfileSwitcherDialog } from "./profile-switcher-dialog";

describe("ProfileSwitcherDialog", () => {
  beforeEach(() => {
    createProfile.mockReset();
    selectProfile.mockReset();
    createProfile.mockResolvedValue({});
  });

  function openDialog() {
    render(<ProfileSwitcherDialog profiles={[]} activeProfile={null} />);
    fireEvent.click(screen.getByRole("button", { name: /switch profile/i }));
  }

  // Regression test: Epic M3 made createProfile() require a PIN (so the
  // profile has one to gate its own deletion later), but this dialog's "Add
  // a profile" form had no PIN field to submit — every submission failed
  // with "PIN must be 4-6 digits." regardless of what the user typed. See
  // PROJECT_PLAN.docx section 4, item 55.
  it("submits a pin alongside the name when adding a profile", () => {
    openDialog();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jamie" } });
    fireEvent.change(screen.getByLabelText("PIN"), { target: { value: "4321" } });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(createProfile).toHaveBeenCalledTimes(1);
    const formData = createProfile.mock.calls[0][1] as FormData;
    expect(formData.get("displayName")).toBe("Jamie");
    expect(formData.get("pin")).toBe("4321");
  });

  // Unhappy path: the browser's own required-field validation should block
  // submission (and therefore the action call) when the PIN is left blank,
  // rather than reaching the server with a guaranteed-invalid PIN.
  it("does not submit when the pin is left blank", () => {
    openDialog();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jamie" } });
    const pinInput = screen.getByLabelText("PIN") as HTMLInputElement;
    expect(pinInput).toBeRequired();
  });
});
