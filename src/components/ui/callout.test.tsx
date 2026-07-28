import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Callout } from "./callout";

describe("Callout", () => {
  it("renders a title and body", () => {
    render(
      <Callout tone="info" title="Derived data">
        <p>Muscle diagrams are inferred, not sourced.</p>
      </Callout>
    );

    expect(screen.getByText("Derived data")).toBeInTheDocument();
    expect(
      screen.getByText("Muscle diagrams are inferred, not sourced.")
    ).toBeInTheDocument();
  });

  it("defaults to the info tone", () => {
    const { container } = render(<Callout>Heads up.</Callout>);
    expect(container.querySelector('[data-slot="callout"]')).toHaveAttribute(
      "data-tone",
      "info"
    );
  });

  it.each(["info", "success", "warning", "danger"] as const)(
    "uses semantic tokens rather than raw palette classes for tone=%s",
    (tone) => {
      const { container } = render(<Callout tone={tone}>Body</Callout>);
      const el = container.querySelector('[data-slot="callout"]')!;
      const className = el.className;

      expect(el).toHaveAttribute("data-tone", tone);
      // The whole reason this primitive exists: no bg-amber-50 /
      // dark:bg-amber-950 pairs hand-written per call site.
      expect(className).not.toMatch(
        /-(?:red|amber|yellow|green|emerald|blue|teal|slate)-\d{2,3}\b/
      );
      expect(className).toMatch(/-subtle\b/);
      expect(className).toMatch(/-border\b/);
      expect(className).toMatch(/-text\b/);
    }
  );

  // Unhappy path: a danger callout is the one tone that must interrupt, so it
  // gets role="alert". The quieter tones must NOT, or every page load shouts.
  it("only announces the danger tone as an alert", () => {
    const { unmount } = render(<Callout tone="danger">Import failed.</Callout>);
    expect(screen.getByRole("alert")).toHaveTextContent("Import failed.");
    unmount();

    render(<Callout tone="warning">Estimated duration.</Callout>);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("hides the decorative icon from assistive tech and can drop it", () => {
    const { container, rerender } = render(<Callout tone="success">Saved.</Callout>);
    const icon = container.querySelector('[data-slot="callout-icon"]')!;
    expect(icon).toHaveAttribute("aria-hidden", "true");

    rerender(
      <Callout tone="success" icon={false}>
        Saved.
      </Callout>
    );
    expect(container.querySelector('[data-slot="callout-icon"]')).toBeNull();
  });

  // Unhappy path: a callout with neither title nor children should not render
  // an empty body wrapper that collapses the layout.
  it("renders nothing in the body when given no content", () => {
    const { container } = render(<Callout tone="info" />);
    expect(container.querySelector('[data-slot="callout-title"]')).toBeNull();
    expect(container.querySelector('[data-slot="callout-body"]')).toBeNull();
    expect(container.querySelector('[data-slot="callout"]')).not.toBeNull();
  });
});
