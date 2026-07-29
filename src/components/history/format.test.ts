import { describe, expect, it } from "vitest";
import { formatWeight } from "./format";

describe("formatWeight", () => {
  it("drops the numeric(7,2) trailing zeros the driver returns", () => {
    expect(formatWeight("50.00")).toBe("50");
    expect(formatWeight("52.50")).toBe("52.5");
  });

  it("accepts numbers as well as strings", () => {
    expect(formatWeight(62.5)).toBe("62.5");
  });

  it("returns null for a missing weight so callers can render their own dash", () => {
    expect(formatWeight(null)).toBeNull();
    expect(formatWeight("")).toBeNull();
  });

  // Unhappy path: a value we can't parse must be shown as-is, never as "NaN".
  it("passes through a non-numeric value instead of rendering NaN", () => {
    expect(formatWeight("bodyweight")).toBe("bodyweight");
  });
});
