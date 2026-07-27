import { describe, expect, it } from "vitest";
import { isEmbeddableVideoUrl } from "./video";

describe("isEmbeddableVideoUrl", () => {
  it("accepts a YouTube embed URL", () => {
    expect(isEmbeddableVideoUrl("https://www.youtube.com/embed/xaCF5qu7j0c?rel=0")).toBe(true);
  });

  it("accepts a Vimeo player URL", () => {
    expect(isEmbeddableVideoUrl("https://player.vimeo.com/video/756793640?badge=0")).toBe(true);
  });

  it("accepts any youtube.com URL, not just /embed/ paths (host-based check, not path-based)", () => {
    expect(isEmbeddableVideoUrl("https://www.youtube.com/watch?v=xaCF5qu7j0c")).toBe(true);
  });

  it("rejects a non-embeddable host", () => {
    expect(isEmbeddableVideoUrl("https://www.muscleandstrength.com/exercises/foo.html")).toBe(false);
  });

  it("rejects null, undefined, and empty string without throwing", () => {
    expect(isEmbeddableVideoUrl(null)).toBe(false);
    expect(isEmbeddableVideoUrl(undefined)).toBe(false);
    expect(isEmbeddableVideoUrl("")).toBe(false);
  });

  it("rejects a malformed URL without throwing", () => {
    expect(isEmbeddableVideoUrl("not a url")).toBe(false);
  });
});
