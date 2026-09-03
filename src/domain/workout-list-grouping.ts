/**
 * Groups a profile's workout list by source Workout Library program, so
 * "Add to my workouts" (Epic Q3) — which creates one workout per training
 * day — doesn't leave the list looking like a wall of near-identical cards.
 * Pure and unit-tested; no I/O. A workout with no sourceProgramId (manually
 * built, generated, or duplicated) is never grouped.
 */

export interface GroupableWorkout {
  id: string;
  updatedAt: Date;
  sourceProgramId: string | null;
  sourceProgramName: string | null;
}

export interface WorkoutProgramGroup<T extends GroupableWorkout> {
  sourceProgramId: string;
  sourceProgramName: string;
  workouts: T[];
  /** Most recent updatedAt among the group's own workouts — the group sorts
   * into the overall list by this, as if it were one item. */
  updatedAt: Date;
}

export type WorkoutListEntry<T extends GroupableWorkout> =
  | { kind: "group"; group: WorkoutProgramGroup<T> }
  | { kind: "single"; workout: T };

/**
 * Input order is not assumed — each group's workouts are sorted by
 * updatedAt (desc) internally, and the overall entry list is sorted by each
 * entry's own updatedAt (a group's = its most recent member's), so a newly
 * started/edited day workout can bring its whole group back to the top.
 */
export function groupWorkoutSummaries<T extends GroupableWorkout>(workouts: T[]): WorkoutListEntry<T>[] {
  const groupsById = new Map<string, WorkoutProgramGroup<T>>();
  const singles: T[] = [];

  for (const w of workouts) {
    if (!w.sourceProgramId) {
      singles.push(w);
      continue;
    }
    const existing = groupsById.get(w.sourceProgramId);
    if (existing) {
      existing.workouts.push(w);
      if (w.updatedAt > existing.updatedAt) existing.updatedAt = w.updatedAt;
    } else {
      groupsById.set(w.sourceProgramId, {
        sourceProgramId: w.sourceProgramId,
        sourceProgramName: w.sourceProgramName ?? w.sourceProgramId,
        workouts: [w],
        updatedAt: w.updatedAt,
      });
    }
  }

  for (const group of groupsById.values()) {
    group.workouts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  const entries: WorkoutListEntry<T>[] = [
    ...[...groupsById.values()].map((group): WorkoutListEntry<T> => ({ kind: "group", group })),
    ...singles.map((workout): WorkoutListEntry<T> => ({ kind: "single", workout })),
  ];

  entries.sort((a, b) => {
    const aTime = (a.kind === "group" ? a.group.updatedAt : a.workout.updatedAt).getTime();
    const bTime = (b.kind === "group" ? b.group.updatedAt : b.workout.updatedAt).getTime();
    return bTime - aTime;
  });

  return entries;
}

export type WorkoutDisplayRow<T extends GroupableWorkout> =
  | { kind: "group"; group: WorkoutProgramGroup<T> }
  | { kind: "run"; workouts: T[] };

/**
 * Batches groupWorkoutSummaries' output for rendering: each group keeps its
 * own row, but consecutive ungrouped singles are collapsed into one "run" so
 * the page can lay them out as a dense grid instead of one card per row —
 * the original /workouts layout, preserved for anything not from the
 * Workout Library.
 */
export function batchWorkoutDisplayRows<T extends GroupableWorkout>(entries: WorkoutListEntry<T>[]): WorkoutDisplayRow<T>[] {
  const rows: WorkoutDisplayRow<T>[] = [];
  for (const entry of entries) {
    if (entry.kind === "group") {
      rows.push({ kind: "group", group: entry.group });
      continue;
    }
    const lastRow = rows[rows.length - 1];
    if (lastRow?.kind === "run") {
      lastRow.workouts.push(entry.workout);
    } else {
      rows.push({ kind: "run", workouts: [entry.workout] });
    }
  }
  return rows;
}
