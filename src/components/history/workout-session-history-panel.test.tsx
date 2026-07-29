import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorkoutSessionHistoryPanel } from "./workout-session-history-panel";
import type { WorkoutSessionHistoryEntry } from "@/db/queries/history";

function entry(overrides: Partial<WorkoutSessionHistoryEntry> = {}): WorkoutSessionHistoryEntry {
  return {
    sessionId: "s1",
    status: "completed",
    startedAt: new Date("2026-07-20T18:00:00Z"),
    completedAt: new Date("2026-07-20T19:00:00Z"),
    volume: 4210.5,
    ...overrides,
  };
}

describe("WorkoutSessionHistoryPanel", () => {
  it("links a finished session to its history entry and rounds the volume", () => {
    render(<WorkoutSessionHistoryPanel sessions={[entry()]} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/history/s1");
    expect(screen.getByText("4,211 vol")).toBeInTheDocument();
  });

  // A session still running belongs in Workout Mode, not the read-only view.
  it("sends a still-running session back into the session runner", () => {
    render(<WorkoutSessionHistoryPanel sessions={[entry({ status: "in_progress" })]} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/session/s1");
  });

  // Unhappy path: a session where nothing was logged has no volume to show,
  // and "0 vol" reads as a judgement rather than an absence.
  it("omits the volume entirely when nothing was logged", () => {
    render(<WorkoutSessionHistoryPanel sessions={[entry({ status: "abandoned", volume: 0 })]} />);
    expect(screen.queryByText(/vol/)).not.toBeInTheDocument();
  });

  it("renders nothing when the workout has never been run", () => {
    const { container } = render(<WorkoutSessionHistoryPanel sessions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
