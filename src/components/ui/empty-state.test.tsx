import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Dumbbell } from "lucide-react";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";

describe("EmptyState", () => {
  it("renders title, description and action", () => {
    render(
      <EmptyState
        icon={Dumbbell}
        title="No workouts yet"
        description="Build one, or generate one from your profile."
        action={<button type="button">Build a workout</button>}
      />
    );

    expect(
      screen.getByRole("heading", { name: "No workouts yet" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Build one, or generate one from your profile.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Build a workout" })
    ).toBeInTheDocument();
  });

  it("renders without an icon, description or action", () => {
    render(<EmptyState title="Nothing here" />);
    expect(
      screen.getByRole("heading", { name: "Nothing here" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("hides the decorative icon from assistive tech", () => {
    const { container } = render(<EmptyState icon={Dumbbell} title="Empty" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  // Unhappy path — the important one. "Nothing logged yet" is a normal first
  // run; it must NOT be announced as an alert or styled like a failure, or a
  // new user's first screen reads as something being broken.
  it("is not an alert, unlike ErrorState", () => {
    const { unmount } = render(
      <EmptyState title="No sessions logged" description="Start one to see it here." />
    );
    expect(screen.queryByRole("alert")).toBeNull();
    unmount();

    render(<ErrorState description="Could not load history." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Could not load history.");
  });

  it("keeps ErrorState's technical detail out of the headline", () => {
    render(
      <ErrorState
        title="Could not load history"
        description="The request failed."
        detail="ECONNREFUSED 127.0.0.1:5432"
      />
    );

    const heading = screen.getByRole("heading", {
      name: "Could not load history",
    });
    expect(heading).not.toHaveTextContent("ECONNREFUSED");
    expect(screen.getByText("ECONNREFUSED 127.0.0.1:5432")).toBeInTheDocument();
  });
});
