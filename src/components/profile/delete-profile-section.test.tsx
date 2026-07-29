import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const deleteProfile = vi.fn();
const push = vi.fn();

vi.mock("@/app/(app)/profile/actions", () => ({
  deleteProfile: (...args: unknown[]) => deleteProfile(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

import { DeleteProfileSection } from "./delete-profile-section";

function open() {
  fireEvent.click(screen.getByRole("button", { name: /delete this profile/i }));
}

function confirm() {
  fireEvent.click(screen.getByRole("button", { name: /^delete profile$/i }));
}

function typePin(value: string) {
  fireEvent.change(screen.getByLabelText(/enter your pin/i), { target: { value } });
}

describe("DeleteProfileSection", () => {
  beforeEach(() => {
    deleteProfile.mockReset();
    push.mockReset();
  });

  it("does not delete anything until the dialog is confirmed", async () => {
    render(<DeleteProfileSection profileId="p1" profileName="Ben" />);
    expect(deleteProfile).not.toHaveBeenCalled();

    open();
    expect(await screen.findByText('Delete "Ben"?')).toBeInTheDocument();
    expect(deleteProfile).not.toHaveBeenCalled();
  });

  // Unhappy path: a too-short PIN must never reach the server action.
  it("rejects a PIN shorter than four digits without calling the server", async () => {
    render(<DeleteProfileSection profileId="p1" profileName="Ben" />);
    open();
    await screen.findByText('Delete "Ben"?');

    typePin("12");
    confirm();

    expect(await screen.findByText("Enter your 4-6 digit PIN")).toBeInTheDocument();
    expect(deleteProfile).not.toHaveBeenCalled();
  });

  it("strips non-digits and caps the PIN at six characters", async () => {
    render(<DeleteProfileSection profileId="p1" profileName="Ben" />);
    open();
    await screen.findByText('Delete "Ben"?');

    typePin("12ab34567890");
    expect(screen.getByLabelText(/enter your pin/i)).toHaveValue("123456");
  });

  // Unhappy path: a wrong PIN keeps the dialog open with the reason showing.
  it("keeps the dialog open and shows why when the PIN is wrong", async () => {
    deleteProfile.mockResolvedValue({ success: false, error: "Incorrect PIN" });
    render(<DeleteProfileSection profileId="p1" profileName="Ben" />);
    open();
    await screen.findByText('Delete "Ben"?');

    typePin("1234");
    confirm();

    expect(await screen.findByText("Incorrect PIN")).toBeInTheDocument();
    expect(screen.getByText('Delete "Ben"?')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("sends the PIN and leaves for home once deletion succeeds", async () => {
    deleteProfile.mockResolvedValue({ success: true });
    render(<DeleteProfileSection profileId="p1" profileName="Ben" />);
    open();
    await screen.findByText('Delete "Ben"?');

    typePin("1234");
    confirm();

    await waitFor(() => expect(deleteProfile).toHaveBeenCalledWith("p1", "1234"));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });
});
