import { describe, expect, it } from "vitest";
import { categorizeProgram, parsePrescription, slugFromUrl } from "./workout-program-conversion";

describe("parsePrescription", () => {
  it("parses a plain sets number and rep range", () => {
    expect(parsePrescription("3", "8-12", null, null)).toEqual({
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      restSeconds: null,
      notes: null,
    });
  });

  it("parses a single rep number as a fixed min/max", () => {
    const result = parsePrescription("3", "10", null, null);
    expect(result.repsMin).toBe(10);
    expect(result.repsMax).toBe(10);
  });

  it("parses a rest range in minutes into seconds", () => {
    expect(parsePrescription("3", "8-12", "1-2 min", null).restSeconds).toBe(90);
  });

  it("falls back to open reps and keeps the source text as a note for AMRAP", () => {
    const result = parsePrescription("3", "AMRAP", null, null);
    expect(result.repsMin).toBeNull();
    expect(result.repsMax).toBeNull();
    expect(result.notes).toBe("AMRAP");
  });

  it("handles a timed burnout set (duration in the sets column, 'Burn' in reps) without fabricating a number", () => {
    const result = parsePrescription("5 Minutes", "Burn", null, null);
    expect(result.sets).toBe(1);
    expect(result.repsMin).toBeNull();
    expect(result.repsMax).toBeNull();
    expect(result.notes).toBe("5 Minutes — Burn");
  });

  it("combines an existing scraped note (e.g. an alternate-exercise suggestion) with a parsed-out reps note", () => {
    const result = parsePrescription("3", "AMRAP", null, "or Lat Pull Down");
    expect(result.notes).toBe("or Lat Pull Down — AMRAP");
  });

  it("returns safe defaults for entirely missing data, the unhappy path", () => {
    expect(parsePrescription(null, null, null, null)).toEqual({
      sets: 1,
      repsMin: null,
      repsMax: null,
      restSeconds: null,
      notes: null,
    });
  });
});

describe("slugFromUrl", () => {
  it("takes the last path segment, case-folded", () => {
    expect(slugFromUrl("https://www.muscleandstrength.com/workouts/4-Day-Maximum-Mass-Workout")).toBe(
      "4-day-maximum-mass-workout",
    );
  });

  it("strips a .html extension", () => {
    expect(slugFromUrl("https://muscleandstrength.com/exercises/push-up.html")).toBe("push-up");
  });

  it("strips a trailing slash and a query string", () => {
    expect(slugFromUrl("https://muscleandstrength.com/workouts/foo/?ref=abc")).toBe("foo");
  });

  // Regression: this is the join key matching a workout program's linked
  // exercises against source_exercises, and separately matching the same
  // program re-imported from a different batch — www vs. no-www must not
  // produce two different slugs for the same page.
  it("produces the same slug with or without a www prefix", () => {
    const a = slugFromUrl("https://www.muscleandstrength.com/workouts/foo");
    const b = slugFromUrl("https://muscleandstrength.com/workouts/foo");
    expect(a).toBe(b);
  });
});

describe("categorizeProgram", () => {
  it("prioritizes equipment-specific categories over goal-based ones", () => {
    expect(categorizeProgram("3 Day Full Body Dumbbell Only Workout", { mainGoal: "Build Muscle" })).toBe(
      "Dumbbell Only",
    );
    expect(categorizeProgram("Kettlebell Ab Workout", {})).toBe("Kettlebell");
  });

  it("appends a Women suffix for women-targeted programs, not a generic one", () => {
    expect(categorizeProgram("8 Week Strength Program for Women", { targetGender: "Female" })).toBe(
      "Strength Training - Women",
    );
    expect(categorizeProgram("8 Week Strength Program", { targetGender: "Male" })).toBe("Strength Training");
  });

  it("falls back to the main goal when the name has no specific signal", () => {
    expect(categorizeProgram("The Grinder", { mainGoal: "Increase Strength" })).toBe("Strength Training");
    expect(categorizeProgram("The Grinder", { mainGoal: "Lose Fat" })).toBe("Fat Loss");
  });

  it("falls back to a catch-all when nothing matches", () => {
    expect(categorizeProgram("Untitled Program", {})).toBe("Mixed Programs");
  });
});
