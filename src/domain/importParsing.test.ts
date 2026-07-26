import { describe, expect, it } from "vitest";
import { computeRowHash, parseMuscleList, parseRelatedLinks, parseYesNo } from "./importParsing";

describe("parseYesNo", () => {
  it("parses Yes and No", () => {
    expect(parseYesNo("Yes")).toBe(true);
    expect(parseYesNo("No")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(parseYesNo("yes")).toBe(true);
    expect(parseYesNo("NO")).toBe(false);
  });

  it("treats missing or blank values as No", () => {
    expect(parseYesNo(null)).toBe(false);
    expect(parseYesNo(undefined)).toBe(false);
    expect(parseYesNo("")).toBe(false);
    expect(parseYesNo("   ")).toBe(false);
  });

  it("throws on an unexpected value rather than guessing", () => {
    expect(() => parseYesNo("Maybe")).toThrow(/Unexpected Yes\/No value/);
    expect(() => parseYesNo(1)).toThrow(/Unexpected Yes\/No value/);
  });
});

describe("parseMuscleList", () => {
  it("splits a comma-delimited list", () => {
    expect(parseMuscleList("Shoulders, Triceps")).toEqual(["Shoulders", "Triceps"]);
  });

  it("returns a single-item list for one muscle", () => {
    expect(parseMuscleList("Calves")).toEqual(["Calves"]);
  });

  it("treats None, Not listed, and blank as no muscles", () => {
    expect(parseMuscleList("None")).toEqual([]);
    expect(parseMuscleList("Not listed")).toEqual([]);
    expect(parseMuscleList("")).toEqual([]);
    expect(parseMuscleList(null)).toEqual([]);
    expect(parseMuscleList(undefined)).toEqual([]);
  });

  it("trims whitespace and drops empty segments from trailing commas", () => {
    expect(parseMuscleList(" Chest ,  Shoulders ,")).toEqual(["Chest", "Shoulders"]);
  });
});

describe("parseRelatedLinks", () => {
  it("parses a single label | url segment", () => {
    expect(parseRelatedLinks("incline | https://example.com/incline")).toEqual([
      { label: "incline", url: "https://example.com/incline" },
    ]);
  });

  it("parses multiple semicolon-separated segments", () => {
    expect(
      parseRelatedLinks(
        "incline | https://example.com/a; rear delt fly | https://example.com/b",
      ),
    ).toEqual([
      { label: "incline", url: "https://example.com/a" },
      { label: "rear delt fly", url: "https://example.com/b" },
    ]);
  });

  it("treats None, Not listed, and blank as no links", () => {
    expect(parseRelatedLinks("Not listed")).toEqual([]);
    expect(parseRelatedLinks("")).toEqual([]);
    expect(parseRelatedLinks(null)).toEqual([]);
    expect(parseRelatedLinks(undefined)).toEqual([]);
  });

  it("keeps a label-only segment instead of dropping malformed data", () => {
    expect(parseRelatedLinks("just a label, no separator")).toEqual([
      { label: "just a label, no separator", url: null },
    ]);
  });

  it("drops empty segments from stray semicolons", () => {
    expect(parseRelatedLinks("a | https://example.com/a;; b | https://example.com/b")).toEqual([
      { label: "a", url: "https://example.com/a" },
      { label: "b", url: "https://example.com/b" },
    ]);
  });
});

describe("computeRowHash", () => {
  it("produces the same hash regardless of key order", () => {
    const a = computeRowHash({ name: "Squat", equipment: "Barbell" });
    const b = computeRowHash({ equipment: "Barbell", name: "Squat" });
    expect(a).toBe(b);
  });

  it("produces a different hash when a value changes", () => {
    const a = computeRowHash({ name: "Squat" });
    const b = computeRowHash({ name: "Front Squat" });
    expect(a).not.toBe(b);
  });

  it("treats Date values deterministically", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    const a = computeRowHash({ lastVerified: date });
    const b = computeRowHash({ lastVerified: new Date("2026-01-01T00:00:00.000Z") });
    expect(a).toBe(b);
  });

  it("distinguishes an empty object from a differently-shaped one", () => {
    expect(computeRowHash({})).not.toBe(computeRowHash({ name: "" }));
  });
});
