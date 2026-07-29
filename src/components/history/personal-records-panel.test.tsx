import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PersonalRecordsPanel } from "./personal-records-panel";
import type { PersonalRecord } from "@/db/queries/history";

function record(overrides: Partial<PersonalRecord> = {}): PersonalRecord {
  return {
    exerciseId: "EX-0001",
    exerciseName: "Barbell Bench Press",
    weight: "80.00",
    weightUnit: "kg",
    reps: 5,
    date: new Date("2026-07-20T18:00:00Z"),
    ...overrides,
  };
}

describe("PersonalRecordsPanel", () => {
  it("renders the record weight as a metric, unit separate, and links to the exercise", () => {
    render(<PersonalRecordsPanel records={[record()]} />);

    const value = screen.getByText("80");
    expect(value).toHaveClass("text-metric");
    expect(screen.getByText("kg")).toBeInTheDocument();
    expect(screen.getByText("5 reps")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Barbell Bench Press/ })).toHaveAttribute(
      "href",
      "/exercises/EX-0001",
    );
  });

  it("shows a designed empty state rather than a bare sentence", () => {
    render(<PersonalRecordsPanel records={[]} />);

    expect(screen.getByText("No personal records yet")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No personal records yet" })).toBeInTheDocument();
  });

  // Unhappy path: a set logged with no weight (bodyweight work) must not print
  // "nullkg" or a stray unit next to the dash.
  it("renders a dash and no unit when the record has no weight", () => {
    render(<PersonalRecordsPanel records={[record({ weight: null, reps: null })]} />);

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("kg")).not.toBeInTheDocument();
    expect(screen.queryByText(/reps/)).not.toBeInTheDocument();
  });
});
