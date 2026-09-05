import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { ExercisePhoto } from "./exercise-photo";

describe("ExercisePhoto", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds the image src from the base URL and exercise id", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_PHOTO_BASE_URL", "https://example.blob.vercel-storage.com");
    render(<ExercisePhoto exerciseId="EX-0042" exerciseName="Barbell Back Squat" />);

    const img = screen.getByRole("img");
    // next/image rewrites src through its own optimizer query string —
    // assert the real target is embedded, not that src equals it exactly.
    expect(decodeURIComponent(img.getAttribute("src") ?? "")).toContain(
      "https://example.blob.vercel-storage.com/exercise-photos/EX-0042.webp",
    );
  });

  it("builds alt text from the exercise name, not a baked-in caption", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_PHOTO_BASE_URL", "https://example.blob.vercel-storage.com");
    render(<ExercisePhoto exerciseId="EX-0042" exerciseName="Barbell Back Squat" />);

    expect(screen.getByRole("img").getAttribute("alt")).toContain("Barbell Back Squat");
  });

  // Unhappy path: no base URL configured (e.g. Blob not provisioned in this
  // environment) — a deployment gap, not something to show an end-user
  // error card for. Renders nothing.
  it("renders nothing when no base URL is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_PHOTO_BASE_URL", "");
    const { container } = render(<ExercisePhoto exerciseId="EX-0042" exerciseName="Barbell Back Squat" />);
    expect(container).toBeEmptyDOMElement();
  });

  // Unhappy path: this specific exercise has no photo (53 of 1,271 don't) or
  // the store is briefly unreachable. Renders nothing rather than an error
  // state — unlike the muscle diagrams, this is a supplemental visual with
  // known partial coverage, not something else on the page depends on.
  it("renders nothing if the image fails to load", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_PHOTO_BASE_URL", "https://example.blob.vercel-storage.com");
    const { container } = render(<ExercisePhoto exerciseId="EX-9001" exerciseName="Barbell Static Hold" />);

    fireEvent.error(screen.getByRole("img"));

    expect(container).toBeEmptyDOMElement();
  });

  it("strips a trailing slash from the base URL before joining", () => {
    vi.stubEnv("NEXT_PUBLIC_EXERCISE_PHOTO_BASE_URL", "https://example.blob.vercel-storage.com/");
    render(<ExercisePhoto exerciseId="EX-0042" exerciseName="Barbell Back Squat" />);

    expect(decodeURIComponent(screen.getByRole("img").getAttribute("src") ?? "")).toContain(
      "https://example.blob.vercel-storage.com/exercise-photos/EX-0042.webp",
    );
  });
});
