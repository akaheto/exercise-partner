import { describe, expect, it } from "vitest";
import {
  buildExerciseFiltersQuery,
  hasActiveFilters,
  parseExerciseFilters,
} from "./exercise-filters";

describe("parseExerciseFilters", () => {
  it("defaults to an unfiltered, unpaginated, card view", () => {
    expect(parseExerciseFilters({})).toEqual({
      q: "",
      muscle: null,
      equipment: null,
      type: null,
      mechanics: null,
      force: null,
      level: null,
      region: null,
      videoOnly: false,
      sort: "name-asc",
      view: "card",
      page: 1,
    });
  });

  it("parses a full set of params", () => {
    const result = parseExerciseFilters({
      q: "squat",
      muscle: "Quads",
      equipment: "Barbell",
      type: "Strength",
      mechanics: "Compound",
      force: "Push",
      level: "Beginner",
      region: "Lower Body",
      video: "yes",
      sort: "muscle",
      view: "table",
      page: "3",
    });
    expect(result).toMatchObject({
      q: "squat",
      muscle: "Quads",
      videoOnly: true,
      sort: "muscle",
      view: "table",
      page: 3,
    });
  });

  it("trims whitespace from the search query", () => {
    expect(parseExerciseFilters({ q: "  squat  " }).q).toBe("squat");
  });

  it("falls back to defaults for an invalid sort, view, or page", () => {
    const result = parseExerciseFilters({ sort: "nonsense", view: "nonsense", page: "not-a-number" });
    expect(result.sort).toBe("name-asc");
    expect(result.view).toBe("card");
    expect(result.page).toBe(1);
  });

  it("treats a zero or negative page as page 1", () => {
    expect(parseExerciseFilters({ page: "0" }).page).toBe(1);
    expect(parseExerciseFilters({ page: "-5" }).page).toBe(1);
  });

  it("takes the first value when Next.js supplies an array (repeated query key)", () => {
    expect(parseExerciseFilters({ muscle: ["Quads", "Chest"] }).muscle).toBe("Quads");
  });

  it("treats an empty string param as unset rather than an active filter", () => {
    expect(parseExerciseFilters({ muscle: "" }).muscle).toBeNull();
  });
});

describe("buildExerciseFiltersQuery", () => {
  const base = parseExerciseFilters({});

  it("produces an empty string when nothing is set", () => {
    expect(buildExerciseFiltersQuery(base, {})).toBe("");
  });

  it("adds only the changed, non-default fields", () => {
    expect(buildExerciseFiltersQuery(base, { muscle: "Quads" })).toBe("?muscle=Quads");
  });

  it("resets page to 1 when a filter changes", () => {
    const onPage3 = { ...base, page: 3 };
    expect(buildExerciseFiltersQuery(onPage3, { muscle: "Quads" })).toBe("?muscle=Quads");
  });

  it("does not reset page when the change is itself a page change", () => {
    const onPage3 = { ...base, page: 3, muscle: "Quads" };
    expect(buildExerciseFiltersQuery(onPage3, { page: 4 })).toBe("?muscle=Quads&page=4");
  });

  it("omits sort/view when they equal the defaults, includes them otherwise", () => {
    expect(buildExerciseFiltersQuery(base, { sort: "name-asc" })).toBe("");
    expect(buildExerciseFiltersQuery(base, { sort: "muscle" })).toBe("?sort=muscle");
    expect(buildExerciseFiltersQuery(base, { view: "table" })).toBe("?view=table");
  });

  it("clearing a filter by setting it to null removes it from the query", () => {
    const withMuscle = { ...base, muscle: "Quads" };
    expect(buildExerciseFiltersQuery(withMuscle, { muscle: null })).toBe("");
  });

  it("round-trips through parse and build", () => {
    const filters = parseExerciseFilters({ q: "row", equipment: "Cable", sort: "equipment", view: "table" });
    const qs = buildExerciseFiltersQuery(base, filters);
    const reparsed = parseExerciseFilters(Object.fromEntries(new URLSearchParams(qs)));
    expect(reparsed).toEqual(filters);
  });
});

describe("hasActiveFilters", () => {
  const base = parseExerciseFilters({});

  it("is false for the default filter state", () => {
    expect(hasActiveFilters(base)).toBe(false);
  });

  it("is true when a search query is present", () => {
    expect(hasActiveFilters({ ...base, q: "squat" })).toBe(true);
  });

  it("is true when videoOnly is set", () => {
    expect(hasActiveFilters({ ...base, videoOnly: true })).toBe(true);
  });

  it("is false for sort/view/page changes alone (not filters)", () => {
    expect(hasActiveFilters({ ...base, sort: "muscle", view: "table", page: 2 })).toBe(false);
  });
});
