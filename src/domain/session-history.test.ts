import { describe, expect, it } from "vitest";
import { computeVolume, groupExerciseHistoryBySession, groupVolumeByWeek, sessionDurationMinutes } from "./session-history";

describe("computeVolume", () => {
  it("returns 0 for no sets", () => {
    expect(computeVolume([])).toBe(0);
  });

  it("sums weight times reps across sets", () => {
    expect(computeVolume([{ weight: 100, reps: 10 }, { weight: 50, reps: 8 }])).toBe(1400);
  });

  it("accepts string weights (as stored in Postgres numeric columns)", () => {
    expect(computeVolume([{ weight: "100.00", reps: 10 }])).toBe(1000);
  });

  it("skips sets with a null weight or null reps", () => {
    expect(computeVolume([{ weight: null, reps: 10 }, { weight: 100, reps: null }])).toBe(0);
  });

  it("skips a set with a non-numeric weight string rather than producing NaN", () => {
    expect(computeVolume([{ weight: "not-a-number", reps: 10 }])).toBe(0);
  });

  it("converts pounds to kilograms for volume calculation", () => {
    const kgVolume = computeVolume([{ weight: 100, reps: 10, weightUnit: "kg" }]);
    const lbVolume = computeVolume([{ weight: 220.46, reps: 10, weightUnit: "lb" }]);
    expect(Math.abs(kgVolume - lbVolume) < 1).toBe(true);
  });

  it("handles mixed units across sets in the same volume calculation", () => {
    const volume = computeVolume([
      { weight: 100, reps: 5, weightUnit: "kg" },
      { weight: 110.23, reps: 5, weightUnit: "lb" },
    ]);
    expect(Math.abs(volume - 750) < 10).toBe(true);
  });

  it("defaults to kg when weightUnit is not specified", () => {
    const withoutUnit = computeVolume([{ weight: 100, reps: 10 }]);
    const withKg = computeVolume([{ weight: 100, reps: 10, weightUnit: "kg" }]);
    expect(withoutUnit).toBe(withKg);
  });
});

describe("groupVolumeByWeek", () => {
  it("returns an empty array for no points", () => {
    expect(groupVolumeByWeek([])).toEqual([]);
  });

  it("buckets same-week dates together, keyed by the Monday of that week", () => {
    const result = groupVolumeByWeek([
      { date: new Date("2026-07-20T10:00:00Z"), volume: 100 }, // Monday
      { date: new Date("2026-07-22T10:00:00Z"), volume: 200 }, // Wednesday, same week
    ]);
    expect(result).toEqual([{ weekStart: "2026-07-20", volume: 300 }]);
  });

  it("sorts buckets chronologically regardless of input order", () => {
    const result = groupVolumeByWeek([
      { date: new Date("2026-07-27T10:00:00Z"), volume: 50 },
      { date: new Date("2026-07-13T10:00:00Z"), volume: 10 },
    ]);
    expect(result.map((r) => r.weekStart)).toEqual(["2026-07-13", "2026-07-27"]);
  });
});

describe("sessionDurationMinutes", () => {
  it("returns null when the session has no completedAt", () => {
    expect(sessionDurationMinutes(new Date("2026-07-20T10:00:00Z"), null)).toBeNull();
  });

  it("rounds to the nearest minute", () => {
    const started = new Date("2026-07-20T10:00:00Z");
    const completed = new Date("2026-07-20T10:32:30Z");
    expect(sessionDurationMinutes(started, completed)).toBe(33);
  });

  it("returns 0 rather than negative for a clock anomaly", () => {
    const started = new Date("2026-07-20T10:32:00Z");
    const completed = new Date("2026-07-20T10:00:00Z");
    expect(sessionDurationMinutes(started, completed)).toBe(0);
  });
});

describe("groupExerciseHistoryBySession", () => {
  it("returns an empty array for no points", () => {
    expect(groupExerciseHistoryBySession([])).toEqual([]);
  });

  it("collapses multiple sets in one session into a single point", () => {
    const result = groupExerciseHistoryBySession([
      { sessionId: "s1", date: new Date("2026-07-20T10:00:00Z"), weight: 100, reps: 10 },
      { sessionId: "s1", date: new Date("2026-07-20T10:05:00Z"), weight: 105, reps: 8 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ sessionId: "s1", maxWeight: 105, volume: 100 * 10 + 105 * 8 });
  });

  it("sorts sessions chronologically regardless of input order", () => {
    const result = groupExerciseHistoryBySession([
      { sessionId: "s2", date: new Date("2026-07-27T10:00:00Z"), weight: 100, reps: 10 },
      { sessionId: "s1", date: new Date("2026-07-20T10:00:00Z"), weight: 90, reps: 10 },
    ]);
    expect(result.map((r) => r.sessionId)).toEqual(["s1", "s2"]);
  });

  it("returns a null maxWeight when no set in the session has a weight", () => {
    const result = groupExerciseHistoryBySession([
      { sessionId: "s1", date: new Date("2026-07-20T10:00:00Z"), weight: null, reps: 12 },
    ]);
    expect(result[0].maxWeight).toBeNull();
    expect(result[0].volume).toBe(0);
  });
});
