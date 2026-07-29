import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MuscleBalancePanel } from "./muscle-balance-panel";

function bars(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-slot="muscle-balance-bar"]'));
}

describe("MuscleBalancePanel", () => {
  it("scales every bar against the biggest muscle in the window", () => {
    const { container } = render(
      <MuscleBalancePanel
        entries={[
          { muscle: "Chest", volume: 4000 },
          { muscle: "Back", volume: 2000 },
        ]}
        weeks={4}
      />,
    );

    expect(bars(container).map((b) => b.style.width)).toEqual(["100%", "50%"]);
    expect(screen.getByText("4,000")).toBeInTheDocument();
  });

  it("labels the window and says it is a read, not advice", () => {
    render(<MuscleBalancePanel entries={[{ muscle: "Chest", volume: 10 }]} weeks={1} />);

    expect(screen.getByText(/last 1 week of training/)).toBeInTheDocument();
    expect(screen.getByText(/not a recommendation/)).toBeInTheDocument();
  });

  // Unhappy path: bodyweight-only training gives every muscle zero volume.
  // Dividing by that max must not produce NaN% and blow up the layout.
  it("renders zero-width bars rather than NaN when nothing has volume", () => {
    const { container } = render(
      <MuscleBalancePanel
        entries={[
          { muscle: "Chest", volume: 0 },
          { muscle: "Back", volume: 0 },
        ]}
        weeks={4}
      />,
    );

    expect(bars(container).map((b) => b.style.width)).toEqual(["0%", "0%"]);
  });

  it("renders nothing at all when there are no entries", () => {
    const { container } = render(<MuscleBalancePanel entries={[]} weeks={4} />);
    expect(container).toBeEmptyDOMElement();
  });
});
