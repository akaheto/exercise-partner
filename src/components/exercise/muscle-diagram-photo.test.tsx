import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { MuscleDiagramPhoto } from "./muscle-diagram-photo";

describe("MuscleDiagramPhoto", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds the image src from the base URL and exercise id", () => {
    vi.stubEnv("NEXT_PUBLIC_MUSCLE_DIAGRAM_BASE_URL", "https://example.blob.vercel-storage.com/muscle-diagrams");
    render(
      <MuscleDiagramPhoto
        exerciseId="EX-0042"
        exerciseName="Barbell Back Squat"
        primaryMuscle="Quads"
        secondaryMuscles={["Glutes", "Hamstrings"]}
      />,
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute(
      "src",
      "https://example.blob.vercel-storage.com/muscle-diagrams/EX-0042.webp",
    );
  });

  // The image's own baked-in legend is invisible to a screen reader — alt
  // text has to come from the database fields, not from the picture itself.
  it("builds alt text from the database fields, not the image", () => {
    vi.stubEnv("NEXT_PUBLIC_MUSCLE_DIAGRAM_BASE_URL", "https://example.blob.vercel-storage.com/muscle-diagrams");
    render(
      <MuscleDiagramPhoto
        exerciseId="EX-0042"
        exerciseName="Barbell Back Squat"
        primaryMuscle="Quads"
        secondaryMuscles={["Glutes", "Hamstrings"]}
      />,
    );

    const img = screen.getByRole("img");
    expect(img.getAttribute("alt")).toContain("Barbell Back Squat");
    expect(img.getAttribute("alt")).toContain("Primary: Quads");
    expect(img.getAttribute("alt")).toContain("Secondary: Glutes, Hamstrings");
  });

  it("omits the secondary clause when there are no secondary muscles", () => {
    vi.stubEnv("NEXT_PUBLIC_MUSCLE_DIAGRAM_BASE_URL", "https://example.blob.vercel-storage.com/muscle-diagrams");
    render(
      <MuscleDiagramPhoto
        exerciseId="EX-0042"
        exerciseName="Barbell Back Squat"
        primaryMuscle="Quads"
        secondaryMuscles={[]}
      />,
    );

    expect(screen.getByRole("img").getAttribute("alt")).not.toContain("Secondary:");
  });

  // Unhappy path: no base URL configured (e.g. Blob not provisioned in this
  // environment). Renders nothing rather than a broken-looking plate.
  it("renders nothing when no base URL is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_MUSCLE_DIAGRAM_BASE_URL", "");
    const { container } = render(
      <MuscleDiagramPhoto
        exerciseId="EX-0042"
        exerciseName="Barbell Back Squat"
        primaryMuscle="Quads"
        secondaryMuscles={[]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  // Unhappy path: the specific image 404s or the store is briefly
  // unreachable. Must fail silent, not show a broken-image icon — the
  // hand-built MuscleDiagram elsewhere on the page already covers this
  // exercise, so there is a real fallback, not just an empty gap.
  it("hides itself if the image fails to load", () => {
    vi.stubEnv("NEXT_PUBLIC_MUSCLE_DIAGRAM_BASE_URL", "https://example.blob.vercel-storage.com/muscle-diagrams");
    const { container } = render(
      <MuscleDiagramPhoto
        exerciseId="EX-0042"
        exerciseName="Barbell Back Squat"
        primaryMuscle="Quads"
        secondaryMuscles={[]}
      />,
    );

    fireEvent.error(screen.getByRole("img"));
    expect(container).toBeEmptyDOMElement();
  });

  it("strips a trailing slash from the base URL before joining", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_MUSCLE_DIAGRAM_BASE_URL",
      "https://example.blob.vercel-storage.com/muscle-diagrams/",
    );
    render(
      <MuscleDiagramPhoto
        exerciseId="EX-0042"
        exerciseName="Barbell Back Squat"
        primaryMuscle="Quads"
        secondaryMuscles={[]}
      />,
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.blob.vercel-storage.com/muscle-diagrams/EX-0042.webp",
    );
  });
});
