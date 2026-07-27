import { describe, expect, it } from "vitest";
import { splitIntoSentences } from "./text";

describe("splitIntoSentences", () => {
  it("splits multiple sentences into separate items", () => {
    expect(splitIntoSentences("Keep the core tight. Breathe steadily throughout.")).toEqual([
      "Keep the core tight.",
      "Breathe steadily throughout.",
    ]);
  });

  it("returns a single-item list for a single sentence", () => {
    expect(splitIntoSentences("Keep the core tight.")).toEqual(["Keep the core tight."]);
  });

  it("handles exclamation and question marks as sentence boundaries", () => {
    expect(splitIntoSentences("Don't rush this! Are you braced? Now begin.")).toEqual([
      "Don't rush this!",
      "Are you braced?",
      "Now begin.",
    ]);
  });

  it("does not split on a decimal number or abbreviation-like period", () => {
    expect(splitIntoSentences("Rest for 2.5 minutes between sets.")).toEqual(["Rest for 2.5 minutes between sets."]);
  });

  it("returns an empty array for null, undefined, or blank input", () => {
    expect(splitIntoSentences(null)).toEqual([]);
    expect(splitIntoSentences(undefined)).toEqual([]);
    expect(splitIntoSentences("")).toEqual([]);
    expect(splitIntoSentences("   ")).toEqual([]);
  });

  it("collapses extra whitespace between sentences", () => {
    expect(splitIntoSentences("First point.    Second point.")).toEqual(["First point.", "Second point."]);
  });
});
