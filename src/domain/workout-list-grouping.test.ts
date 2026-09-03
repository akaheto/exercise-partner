import { describe, expect, it } from "vitest";
import { batchWorkoutDisplayRows, groupWorkoutSummaries, type GroupableWorkout } from "./workout-list-grouping";

function w(id: string, minutesAgo: number, sourceProgramId: string | null, sourceProgramName: string | null = null): GroupableWorkout {
  return {
    id,
    updatedAt: new Date(Date.now() - minutesAgo * 60_000),
    sourceProgramId,
    sourceProgramName,
  };
}

describe("groupWorkoutSummaries", () => {
  it("returns an empty list for no workouts", () => {
    expect(groupWorkoutSummaries([])).toEqual([]);
  });

  it("treats a workout with no sourceProgramId as a standalone single, never grouped", () => {
    const entries = groupWorkoutSummaries([w("a", 0, null)]);
    expect(entries).toEqual([{ kind: "single", workout: expect.objectContaining({ id: "a" }) }]);
  });

  it("groups several workouts sharing a sourceProgramId into one entry", () => {
    const entries = groupWorkoutSummaries([
      w("day1", 3, "WP-0001", "4 Day Split"),
      w("day2", 2, "WP-0001", "4 Day Split"),
      w("day3", 1, "WP-0001", "4 Day Split"),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe("group");
    if (entries[0].kind !== "group") throw new Error("unreachable");
    expect(entries[0].group.sourceProgramId).toBe("WP-0001");
    expect(entries[0].group.sourceProgramName).toBe("4 Day Split");
    expect(entries[0].group.workouts.map((x) => x.id)).toEqual(["day3", "day2", "day1"]); // newest first within the group
  });

  it("keeps two different source programs as two separate groups", () => {
    const entries = groupWorkoutSummaries([
      w("a1", 5, "WP-0001", "Program A"),
      w("b1", 4, "WP-0002", "Program B"),
      w("a2", 3, "WP-0001", "Program A"),
    ]);
    const groupIds = entries.filter((e) => e.kind === "group").map((e) => (e.kind === "group" ? e.group.sourceProgramId : null));
    expect(new Set(groupIds)).toEqual(new Set(["WP-0001", "WP-0002"]));
  });

  it("sorts groups and singles together by most-recent activity, not by type", () => {
    const entries = groupWorkoutSummaries([
      w("old-single", 100, null),
      w("group-day", 1, "WP-0001", "Recent Program"), // most recently updated overall
      w("mid-single", 50, null),
    ]);
    expect(entries.map((e) => (e.kind === "group" ? e.group.sourceProgramId : e.workout.id))).toEqual([
      "WP-0001",
      "mid-single",
      "old-single",
    ]);
  });

  it("a group's sort position uses its most-recently-updated member, not its oldest", () => {
    const entries = groupWorkoutSummaries([
      w("newer-single", 10, null),
      w("stale-day", 60, "WP-0001", "Program"), // old on its own...
      w("fresh-day", 1, "WP-0001", "Program"), // ...but this sibling was just touched
    ]);
    // The group should sort ahead of newer-single because fresh-day (1 min ago) beats it.
    expect(entries[0].kind).toBe("group");
  });

  // Unhappy path: sourceProgramId set but sourceProgramName missing (shouldn't
  // happen given how rows are written, but the DB column is nullable) falls
  // back to the id rather than rendering a blank group header.
  it("falls back to sourceProgramId as the header when sourceProgramName is null", () => {
    const entries = groupWorkoutSummaries([w("a", 0, "WP-0099", null)]);
    expect(entries[0]).toEqual({
      kind: "group",
      group: expect.objectContaining({ sourceProgramName: "WP-0099" }),
    });
  });
});

describe("batchWorkoutDisplayRows", () => {
  it("returns nothing for no entries", () => {
    expect(batchWorkoutDisplayRows([])).toEqual([]);
  });

  it("collapses consecutive singles into one run row", () => {
    const entries = groupWorkoutSummaries([w("a", 2, null), w("b", 1, null), w("c", 0, null)]);
    const rows = batchWorkoutDisplayRows(entries);
    expect(rows).toEqual([{ kind: "run", workouts: expect.arrayContaining([expect.objectContaining({ id: "a" })]) }]);
    expect(rows[0].kind === "run" && rows[0].workouts.map((x) => x.id)).toEqual(["c", "b", "a"]);
  });

  it("keeps a group as its own row and does not merge it into a neighboring run", () => {
    const entries = groupWorkoutSummaries([
      w("single1", 3, null),
      w("day1", 2, "WP-0001", "Program"),
      w("day2", 1, "WP-0001", "Program"),
      w("single2", 0, null),
    ]);
    const rows = batchWorkoutDisplayRows(entries);
    // single2 (most recent) sorts first, then the group, then single1.
    expect(rows.map((r) => r.kind)).toEqual(["run", "group", "run"]);
    expect(rows[0].kind === "run" && rows[0].workouts.map((x) => x.id)).toEqual(["single2"]);
    expect(rows[2].kind === "run" && rows[2].workouts.map((x) => x.id)).toEqual(["single1"]);
  });

  // Unhappy path: two separate runs of singles split by a group in between
  // must stay as two distinct run rows, not merge across the group.
  it("does not merge two runs separated by a group", () => {
    const entries = groupWorkoutSummaries([
      w("newest-single", 10, null),
      w("day1", 5, "WP-0001", "Program"),
      w("oldest-single", 1, null),
    ]);
    const rows = batchWorkoutDisplayRows(entries);
    expect(rows.map((r) => r.kind)).toEqual(["run", "group", "run"]);
  });
});
