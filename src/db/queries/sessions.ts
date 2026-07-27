import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sessions, sessionSets } from "@/db/schema";
import type { WorkoutForEdit } from "@/db/queries/workouts";

export interface SessionSetRecord {
  id: number;
  exerciseId: string;
  setNumber: number;
  weight: string | null;
  weightUnit: string | null;
  reps: number | null;
  notes: string | null;
  completedAt: Date;
}

export interface SessionForRunning {
  id: string;
  profileId: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  snapshot: Pick<WorkoutForEdit, "id" | "name" | "description" | "blocks">;
  loggedSets: SessionSetRecord[];
}

/** Fetches a session with its immutable snapshot and every set logged so
 * far, in the order they were completed. Returns null if it doesn't exist or
 * belongs to a different profile. */
export async function getSessionForRunning(sessionId: string, profileId: string): Promise<SessionForRunning | null> {
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!session || session.profileId !== profileId) return null;
  if (!session.workoutSnapshot) return null;

  const loggedSets = await db
    .select()
    .from(sessionSets)
    .where(eq(sessionSets.sessionId, sessionId))
    .orderBy(asc(sessionSets.completedAt), asc(sessionSets.id));

  return {
    id: session.id,
    profileId: session.profileId,
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    snapshot: session.workoutSnapshot as SessionForRunning["snapshot"],
    loggedSets,
  };
}

/** The most recent in-progress session for a profile, if any — used to offer
 * "resume" instead of silently letting a second session start. */
export async function getActiveSessionForProfile(profileId: string) {
  const [session] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.profileId, profileId), eq(sessions.status, "in_progress")))
    .orderBy(asc(sessions.startedAt))
    .limit(1);
  return session ?? null;
}
