import { describe, expect, it } from "vitest";
import { parsePrescription } from "./workout-program-conversion";

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
