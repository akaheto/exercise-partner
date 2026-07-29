import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionStatusBadge } from "./session-status-badge";

describe("SessionStatusBadge", () => {
  it("uses the success variant's token pair for a completed session", () => {
    render(<SessionStatusBadge status="completed" />);
    const badge = screen.getByText(/Completed/);
    // The point of the variant is that both halves of the colour pair come
    // from tokens, so the dark theme is handled centrally.
    expect(badge).toHaveClass("bg-success-subtle");
    expect(badge).toHaveClass("text-success-text");
  });

  it("uses the info variant for a session still running", () => {
    render(<SessionStatusBadge status="in_progress" />);
    const badge = screen.getByText(/In progress/);
    expect(badge).toHaveClass("bg-info-subtle");
    expect(badge).toHaveClass("text-info-text");
  });

  // Unhappy path — and an unknown status is deliberately treated the same way:
  // ending early is not an error, so it must not render in destructive red.
  it("renders an unknown or abandoned status as muted, never destructive", () => {
    render(<SessionStatusBadge status="something_new" />);
    const badge = screen.getByText(/Ended early/);
    expect(badge).toHaveClass("bg-muted");
    expect(badge).not.toHaveClass("bg-destructive-subtle");
    expect(badge).not.toHaveClass("text-destructive-text");
  });
});
