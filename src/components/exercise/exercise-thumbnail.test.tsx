import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { ExerciseThumbnail } from "./exercise-thumbnail";

describe("ExerciseThumbnail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers the photorealistic photo when a base URL is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_PHOTO_BASE_URL", "https://example.blob.vercel-storage.com");
    render(
      <ExerciseThumbnail
        exerciseId="EX-0042"
        thumbnailUrl="https://cdn.muscleandstrength.com/thumb.jpg"
        alt="Barbell Back Squat"
        sizes="200px"
      />,
    );

    expect(decodeURIComponent(screen.getByRole("img").getAttribute("src") ?? "")).toContain(
      "https://example.blob.vercel-storage.com/exercise-photos/EX-0042.webp",
    );
  });

  it("falls back to the hotlinked thumbnail when no photo base URL is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_PHOTO_BASE_URL", "");
    render(
      <ExerciseThumbnail
        exerciseId="EX-0042"
        thumbnailUrl="https://cdn.muscleandstrength.com/thumb.jpg"
        alt="Barbell Back Squat"
        sizes="200px"
      />,
    );

    expect(decodeURIComponent(screen.getByRole("img").getAttribute("src") ?? "")).toContain(
      "https://cdn.muscleandstrength.com/thumb.jpg",
    );
  });

  // The real reason this component exists: 53 of 1,271 exercises have no
  // photo, but nearly all of those still have the older spreadsheet
  // thumbnail — a photo load failure must not lose that existing coverage.
  it("falls forward to the thumbnail if the photo fails to load", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_PHOTO_BASE_URL", "https://example.blob.vercel-storage.com");
    render(
      <ExerciseThumbnail
        exerciseId="EX-9001"
        thumbnailUrl="https://cdn.muscleandstrength.com/thumb.jpg"
        alt="Barbell Static Hold"
        sizes="200px"
      />,
    );

    fireEvent.error(screen.getByRole("img"));

    expect(decodeURIComponent(screen.getByRole("img").getAttribute("src") ?? "")).toContain(
      "https://cdn.muscleandstrength.com/thumb.jpg",
    );
  });

  it("renders the fallback when both the photo and the thumbnail fail", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_PHOTO_BASE_URL", "https://example.blob.vercel-storage.com");
    render(
      <ExerciseThumbnail
        exerciseId="EX-9001"
        thumbnailUrl="https://cdn.muscleandstrength.com/thumb.jpg"
        alt="Barbell Static Hold"
        sizes="200px"
        fallback={<span data-testid="icon-fallback">icon</span>}
      />,
    );

    fireEvent.error(screen.getByRole("img")); // photo fails -> thumbnail
    fireEvent.error(screen.getByRole("img")); // thumbnail fails -> fallback

    expect(screen.getByTestId("icon-fallback")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders the fallback immediately when neither source is available", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_PHOTO_BASE_URL", "");
    render(
      <ExerciseThumbnail
        exerciseId="EX-9001"
        thumbnailUrl={null}
        alt="Barbell Static Hold"
        sizes="200px"
        fallback={<span data-testid="icon-fallback">icon</span>}
      />,
    );

    expect(screen.getByTestId("icon-fallback")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
