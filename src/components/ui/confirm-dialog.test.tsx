import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";
import { Button } from "./button";

function openDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Delete profile" }));
}

function renderDialog(
  onConfirm: () => unknown,
  props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}
) {
  return render(
    <ConfirmDialog
      trigger={
        <Button variant="destructive-quiet" size="sm">
          Delete profile
        </Button>
      }
      title="Delete this profile?"
      description="All workouts and history for it go too. This cannot be undone."
      confirmLabel="Delete"
      onConfirm={onConfirm as () => void}
      {...props}
    />
  );
}

describe("ConfirmDialog", () => {
  it("does not run the action until the user confirms", async () => {
    const onConfirm = vi.fn();
    renderDialog(onConfirm);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByText("Delete this profile?")).toBeNull();

    openDialog();
    expect(await screen.findByText("Delete this profile?")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it("closes on success", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderDialog(onConfirm);

    openDialog();
    await screen.findByText("Delete this profile?");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(screen.queryByText("Delete this profile?")).toBeNull()
    );
  });

  it("cancelling leaves the action unrun", async () => {
    const onConfirm = vi.fn();
    renderDialog(onConfirm);

    openDialog();
    await screen.findByText("Delete this profile?");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(screen.queryByText("Delete this profile?")).toBeNull()
    );
    expect(onConfirm).not.toHaveBeenCalled();
  });

  // Unhappy path: a thrown action must keep the dialog OPEN and show why.
  // Closing optimistically here loses the only copy of the error message.
  it("keeps the dialog open and surfaces the reason when the action throws", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("Wrong PIN"));
    renderDialog(onConfirm);

    openDialog();
    await screen.findByText("Delete this profile?");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Wrong PIN")).toBeInTheDocument();
    expect(screen.getByText("Delete this profile?")).toBeInTheDocument();
  });

  // Unhappy path: a server action that resolves with { error } is a failure
  // too, even though nothing threw.
  it("treats a resolved { error } as a failure", async () => {
    const onConfirm = vi.fn().mockResolvedValue({ error: "Profile is in use" });
    renderDialog(onConfirm);

    openDialog();
    await screen.findByText("Delete this profile?");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Profile is in use")).toBeInTheDocument();
    expect(screen.getByText("Delete this profile?")).toBeInTheDocument();
  });

  // Unhappy path: a slow server action must not be fired twice by an
  // impatient double-click.
  it("disables the confirm button while the action is in flight", async () => {
    let release: (() => void) | undefined;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    );
    renderDialog(onConfirm);

    openDialog();
    await screen.findByText("Delete this profile?");

    const confirm = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(confirm);

    await waitFor(() => expect(confirm).toBeDisabled());
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    release?.();
    await waitFor(() =>
      expect(screen.queryByText("Delete this profile?")).toBeNull()
    );
  });

  it("uses the solid destructive confirm button per D3", async () => {
    renderDialog(vi.fn());

    // Grab the trigger first: base-ui marks the rest of the page inert once
    // the dialog is open, so it is no longer reachable by role.
    const trigger = screen.getByRole("button", { name: "Delete profile" });
    expect(trigger.className).toMatch(/bg-destructive-subtle/);

    openDialog();
    await screen.findByText("Delete this profile?");

    const confirm = screen.getByRole("button", { name: "Delete" });
    // Solid fill, not the tinted -subtle surface used by the row trigger.
    expect(confirm.className).toMatch(/\bbg-destructive\b/);
    expect(confirm.className).not.toMatch(/bg-destructive-subtle/);
  });
});
