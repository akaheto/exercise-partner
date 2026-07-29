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

  // Unhappy path: no base URL configured at all (e.g. Blob not provisioned
  // in this environment) — a deployment gap, not something to show an
  // end-user error card for. Renders nothing.
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
  // unreachable. This is now the only muscle-visual on the exercise detail
  // page (MuscleDiagram was removed from it by request once photo coverage
  // was confirmed complete), so a failure has to say something rather than
  // leave a silent, unexplained gap.
  it("shows an error state, not a broken image, if loading fails", () => {
    vi.stubEnv("NEXT_PUBLIC_MUSCLE_DIAGRAM_BASE_URL", "https://example.blob.vercel-storage.com/muscle-diagrams");
    render(
      <MuscleDiagramPhoto
        exerciseId="EX-0042"
        exerciseName="Barbell Back Squat"
        primaryMuscle="Quads"
        secondaryMuscles={[]}
      />,
    );

    fireEvent.error(screen.getByRole("img"));

    expect(screen.getByText("Image unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
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
