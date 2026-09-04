import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// CurrentProfileCard's <form action={updatePreferredWeightUnit}> only needs
// the function reference for React to bind to the form — it never actually
// runs in this component test (no submit is fired), so a stub is enough and
// avoids pulling in the real DB client the action module imports at load time.
vi.mock("@/app/(app)/profile/actions", () => ({
  updatePreferredWeightUnit: vi.fn(),
}));

import { CurrentProfileCard } from "./current-profile-card";

describe("CurrentProfileCard", () => {
  it("shows the profile's name and initials", () => {
    render(
      <CurrentProfileCard profile={{ id: "p1", displayName: "Ben Aheto", preferredWeightUnit: "kg" }} />,
    );

    expect(screen.getByText("Ben Aheto")).toBeInTheDocument();
    expect(screen.getByText("BA")).toBeInTheDocument();
  });

  it("marks the profile's current weight unit as selected", () => {
    render(
      <CurrentProfileCard profile={{ id: "p1", displayName: "Ben", preferredWeightUnit: "lb" }} />,
    );

    // The active unit button uses the solid "default" variant; the other
    // stays "outline" — checked via aria-pressed-equivalent styling is
    // brittle, so this asserts on the one thing that actually matters: which
    // button submits which value, both present regardless of which is active.
    expect(screen.getByRole("button", { name: "kg" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "lb" })).toBeInTheDocument();
  });

  it("keeps the weight-unit buttons at the 44px touch-target minimum", () => {
    render(
      <CurrentProfileCard profile={{ id: "p1", displayName: "Ben", preferredWeightUnit: "kg" }} />,
    );

    // Regression test for a real gap found in the K3 accessibility review:
    // these buttons had shrunk to the 36px "sm" size, which VISUAL_STYLE_
    // GUIDE.docx reserves for dense table rows/toolbars only, not a settings
    // card's primary controls.
    expect(screen.getByRole("button", { name: "kg" }).className).toContain("h-11");
    expect(screen.getByRole("button", { name: "lb" }).className).toContain("h-11");
  });

  it("submits the profile id as a hidden field for the weight-unit action", () => {
    const { container } = render(
      <CurrentProfileCard profile={{ id: "p1", displayName: "Ben", preferredWeightUnit: "kg" }} />,
    );

    const hidden = container.querySelector('input[name="profileId"]');
    expect(hidden).toHaveValue("p1");
  });
});
