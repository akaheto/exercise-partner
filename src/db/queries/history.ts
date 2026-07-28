import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sessions, sessionSets, sourceExercises } from "@/db/schema";
import { computeVolume } from "@/domain/session-history";
import type { WorkoutForEdit } from "@/db/queries/workouts";

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weight: string | null;
  weightUnit: string | null;
  reps: number | null;
  date: Date;
}

export interface SessionSummary {
  id: string;
  workoutName: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  exerciseCount: number;
  setCount: number;
  volume: number;
}

/** Every session for a profile, most recent first. Reads the snapshot for
 * the workout name so this survives the template being renamed or deleted. */
export async function listSessionSummaries(profileId: string): Promise<SessionSummary[]> {
  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.profileId, profileId))
    .orderBy(desc(sessions.startedAt));

  if (rows.length === 0) return [];

  const setRows = await db
    .select({
      sessionId: sessionSets.sessionId,
      exerciseId: sessionSets.exerciseId,
      weight: sessionSets.weight,
      reps: sessionSets.reps,
    })
    .from(sessionSets)
    .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
    .where(eq(sessions.profileId, profileId));

  const bySession = new Map<string, typeof setRows>();
  for (const row of setRows) {
    if (!bySession.has(row.sessionId)) bySession.set(row.sessionId, []);
    bySession.get(row.sessionId)!.push(row);
  }

  return rows.map((session) => {
    const snapshot = session.workoutSnapshot as Pick<WorkoutForEdit, "name" | "blocks"> | null;
    const sessionSetRows = bySession.get(session.id) ?? [];
    const exerciseIds = new Set(sessionSetRows.map((s) => s.exerciseId));
    return {
      id: session.id,
      workoutName: snapshot?.name ?? "(workout deleted)",
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      exerciseCount: exerciseIds.size,
      setCount: sessionSetRows.length,
      volume: computeVolume(sessionSetRows),
    };
  });
}

export interface SessionDetailExercise {
  exerciseId: string;
  exerciseName: string;
  sets: {
    setNumber: number;
    weight: string | null;
    weightUnit: string | null;
    reps: number | null;
    notes: string | null;
  }[];
}

export interface SessionDetail {
  id: string;
  workoutName: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  exercises: SessionDetailExercise[];
}

/** Full detail for one session: snapshot exercises in their original order,
 * each with every logged set. Returns null if it doesn't exist or belongs to
 * a different profile. */
export async function getSessionDetail(sessionId: string, profileId: string): Promise<SessionDetail | null> {
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!session || session.profileId !== profileId) return null;

  const snapshot = session.workoutSnapshot as Pick<WorkoutForEdit, "name" | "blocks"> | null;
  const setRows = await db
    .select()
    .from(sessionSets)
    .where(eq(sessionSets.sessionId, sessionId))
    .orderBy(sessionSets.completedAt);

  const setsByExercise = new Map<string, typeof setRows>();
  for (const row of setRows) {
    if (!setsByExercise.has(row.exerciseId)) setsByExercise.set(row.exerciseId, []);
    setsByExercise.get(row.exerciseId)!.push(row);
  }

  const orderedExerciseIds: { id: string; name: string }[] = [];
  const seen = new Set<string>();
  for (const block of snapshot?.blocks ?? []) {
    for (const item of block.items) {
      if (seen.has(item.exerciseId)) continue;
      seen.add(item.exerciseId);
      orderedExerciseIds.push({ id: item.exerciseId, name: item.exerciseName });
    }
  }
  // Sets for an exercise no longer in the snapshot (shouldn't happen, since
  // the snapshot is immutable, but guards against not silently dropping data).
  for (const exerciseId of setsByExercise.keys()) {
    if (!seen.has(exerciseId)) orderedExerciseIds.push({ id: exerciseId, name: exerciseId });
  }

  return {
    id: session.id,
    workoutName: snapshot?.name ?? "(workout deleted)",
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    exercises: orderedExerciseIds.map(({ id, name }) => ({
      exerciseId: id,
      exerciseName: name,
      sets: (setsByExercise.get(id) ?? []).map((s) => ({
        setNumber: s.setNumber,
        weight: s.weight,
        weightUnit: s.weightUnit,
        reps: s.reps,
        notes: s.notes,
      })),
    })),
  };
}

export interface ExerciseHistoryPoint {
  sessionId: string;
  date: Date;
  setNumber: number;
  weight: string | null;
  reps: number | null;
}

/** Every logged set for one exercise across a profile's whole history,
 * chronological — the "performance over time" view (Epic I2/I3). */
export async function getExerciseHistory(exerciseId: string, profileId: string): Promise<ExerciseHistoryPoint[]> {
  const rows = await db
    .select({
      sessionId: sessionSets.sessionId,
      date: sessionSets.completedAt,
      setNumber: sessionSets.setNumber,
      weight: sessionSets.weight,
      reps: sessionSets.reps,
    })
    .from(sessionSets)
    .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
    .where(and(eq(sessionSets.exerciseId, exerciseId), eq(sessions.profileId, profileId)))
    .orderBy(sessionSets.completedAt);

  return rows;
}

export interface WorkoutSessionHistoryEntry {
  sessionId: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  volume: number;
}

/** Every past session run against one specific workout template — "same
 * workout over time" (Epic I2). */
export async function getWorkoutSessionHistory(
  workoutId: string,
  profileId: string,
): Promise<WorkoutSessionHistoryEntry[]> {
  const rows = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.workoutId, workoutId), eq(sessions.profileId, profileId)))
    .orderBy(desc(sessions.startedAt));

  if (rows.length === 0) return [];

  const setRows = await db
    .select({ sessionId: sessionSets.sessionId, weight: sessionSets.weight, reps: sessionSets.reps })
    .from(sessionSets)
    .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
    .where(and(eq(sessions.workoutId, workoutId), eq(sessions.profileId, profileId)));

  const bySession = new Map<string, typeof setRows>();
  for (const row of setRows) {
    if (!bySession.has(row.sessionId)) bySession.set(row.sessionId, []);
    bySession.get(row.sessionId)!.push(row);
  }

  return rows.map((session) => ({
    sessionId: session.id,
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    volume: computeVolume(bySession.get(session.id) ?? []),
  }));
}

export interface ExportSet {
  sessionId: string;
  workoutName: string;
  sessionStatus: string;
  sessionStartedAt: Date;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weight: string | null;
  weightUnit: string | null;
  reps: number | null;
  notes: string | null;
  completedAt: Date;
}

/** Personal records (max weight) for all exercises a profile has done.
 * One row per exercise, sorted by exercise name. */
export async function getPersonalRecords(profileId: string): Promise<PersonalRecord[]> {
  const rows = await db
    .select({
      exerciseId: sessionSets.exerciseId,
      exerciseName: sourceExercises.name,
      weight: sessionSets.weight,
      weightUnit: sessionSets.weightUnit,
      reps: sessionSets.reps,
      date: sessionSets.completedAt,
    })
    .from(sessionSets)
    .innerJoin(sessions, eq(sessionSets.sessionId, sessions.id))
    .innerJoin(sourceExercises, eq(sessionSets.exerciseId, sourceExercises.exerciseId))
    .where(and(eq(sessions.profileId, profileId), eq(sessions.status, "completed")));

  // Group by exercise and keep only the max weight for each
  const prMap = new Map<string, PersonalRecord>();

  for (const row of rows) {
    const key = row.exerciseId;
    const current = prMap.get(key);

    if (!current || (row.weight && (!current.weight || Number(row.weight) > Number(current.weight)))) {
      prMap.set(key, {
        exerciseId: row.exerciseId,
        exerciseName: row.exerciseName ?? row.exerciseId,
        weight: row.weight,
        weightUnit: row.weightUnit,
        reps: row.reps,
        date: row.date,
      });
    }
  }

  return Array.from(prMap.values()).sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}

/** Flat, one-row-per-set view of a profile's entire history — the shape
 * both the CSV and JSON export (Epic I4) are built from. */
export async function listAllSetsForExport(profileId: string): Promise<ExportSet[]> {
  const rows = await db
    .select({
      sessionId: sessionSets.sessionId,
      sessionStatus: sessions.status,
      sessionStartedAt: sessions.startedAt,
      workoutSnapshot: sessions.workoutSnapshot,
      exerciseId: sessionSets.exerciseId,
      exerciseName: sourceExercises.name,
      setNumber: sessionSets.setNumber,
      weight: sessionSets.weight,
      weightUnit: sessionSets.weightUnit,
      reps: sessionSets.reps,
      notes: sessionSets.notes,
      completedAt: sessionSets.completedAt,
    })
    .from(sessionSets)
    .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
    .leftJoin(sourceExercises, eq(sourceExercises.exerciseId, sessionSets.exerciseId))
    .where(eq(sessions.profileId, profileId))
    .orderBy(sessions.startedAt, sessionSets.completedAt);

  return rows.map((r) => ({
    sessionId: r.sessionId,
    workoutName: (r.workoutSnapshot as { name?: string } | null)?.name ?? "(workout deleted)",
    sessionStatus: r.sessionStatus,
    sessionStartedAt: r.sessionStartedAt,
    exerciseId: r.exerciseId,
    exerciseName: r.exerciseName ?? r.exerciseId,
    setNumber: r.setNumber,
    weight: r.weight,
    weightUnit: r.weightUnit,
    reps: r.reps,
    notes: r.notes,
    completedAt: r.completedAt,
  }));
}
