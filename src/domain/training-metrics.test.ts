import { describe, expect, it } from "vitest";
import { groupMuscleVolumeByWeek, summarizeMuscleBalance, type MuscleWeekVolume } from "./training-metrics";

describe("groupMuscleVolumeByWeek", () => {
  it("returns an empty array for no points", () => {
    expect(groupMuscleVolumeByWeek([])).toEqual([]);
  });

  it("sums sets for the same muscle within the same week", () => {
    const result = groupMuscleVolumeByWeek([
      { muscle: "Chest", date: new Date("2026-07-20T10:00:00Z"), sets: [{ weight: 100, reps: 10 }] },
      { muscle: "Chest", date: new Date("2026-07-22T10:00:00Z"), sets: [{ weight: 50, reps: 8 }] },
    ]);
    expect(result).toEqual([{ muscle: "Chest", weekStart: "2026-07-20", volume: 1400 }]);
  });

  it("keeps different muscles in the same week as separate rows", () => {
    const result = groupMuscleVolumeByWeek([
      { muscle: "Chest", date: new Date("2026-07-20T10:00:00Z"), sets: [{ weight: 100, reps: 10 }] },
      { muscle: "Quads", date: new Date("2026-07-20T10:00:00Z"), sets: [{ weight: 80, reps: 10 }] },
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.muscle).sort()).toEqual(["Chest", "Quads"]);
  });

  it("sorts chronologically, then alphabetically within a week", () => {
    const result = groupMuscleVolumeByWeek([
      { muscle: "Quads", date: new Date("2026-07-27T10:00:00Z"), sets: [{ weight: 10, reps: 1 }] },
      { muscle: "Chest", date: new Date("2026-07-20T10:00:00Z"), sets: [{ weight: 10, reps: 1 }] },
      { muscle: "Back", date: new Date("2026-07-20T10:00:00Z"), sets: [{ weight: 10, reps: 1 }] },
    ]);
    expect(result.map((r) => `${r.weekStart}/${r.muscle}`)).toEqual(["2026-07-20/Back", "2026-07-20/Chest", "2026-07-27/Quads"]);
  });
});

const fixture: MuscleWeekVolume[] = [
  { muscle: "Chest", weekStart: "2026-06-29", volume: 1000 }, // old week, excluded by a 2-week window
  { muscle: "Chest", weekStart: "2026-07-20", volume: 500 },
  { muscle: "Quads", weekStart: "2026-07-20", volume: 300 },
  { muscle: "Chest", weekStart: "2026-07-27", volume: 200 },
];

describe("summarizeMuscleBalance", () => {
  it("returns an empty array for no data", () => {
    expect(summarizeMuscleBalance([], 4)).toEqual([]);
  });

  it("sums each muscle across the most recent N week buckets present in the data", () => {
    const result = summarizeMuscleBalance(fixture, 2);
    expect(result).toEqual([
      { muscle: "Chest", volume: 700 },
      { muscle: "Quads", volume: 300 },
    ]);
  });

  it("excludes weeks older than the window, even if they'd change the ranking", () => {
    const result = summarizeMuscleBalance(fixture, 1);
    expect(result).toEqual([{ muscle: "Chest", volume: 200 }]);
  });

  it("ranks muscles highest volume first", () => {
    const result = summarizeMuscleBalance(fixture, 4);
    expect(result[0].muscle).toBe("Chest");
    expect(result[0].volume).toBeGreaterThan(result[1].volume);
  });
});
