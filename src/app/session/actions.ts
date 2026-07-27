"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { sessions, sessionSets } from "@/db/schema";
import { getWorkoutForEdit } from "@/db/queries/workouts";
import { getActiveProfileId } from "@/lib/active-profile";
import { requireSiteSession } from "@/lib/require-site-session";

async function requireOwnedSession(sessionId: string) {
  await requireSiteSession();
  const profileId = await getActiveProfileId();
  if (!profileId) redirect("/profile");

  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!session || session.profileId !== profileId) throw new Error("Session not found");
  return { session, profileId };
}

/** Snapshots the workout as it is right now and starts a session against
 * that snapshot — later edits to the template never change what this
 * session is understood to have prescribed. */
export async function startSession(workoutId: string): Promise<never> {
  await requireSiteSession();
  const profileId = await getActiveProfileId();
  if (!profileId) redirect("/profile");

  const workout = await getWorkoutForEdit(workoutId, profileId);
  if (!workout) throw new Error("Workout not found");

  const [session] = await db
    .insert(sessions)
    .values({
      profileId,
      workoutId,
      workoutSnapshot: workout,
      status: "in_progress",
    })
    .returning();

  redirect(`/session/${session.id}`);
}

export interface LogSetInput {
  exerciseId: string;
  setNumber: number;
  weight: number | null;
  weightUnit: "kg" | "lb" | null;
  reps: number | null;
  notes: string | null;
}

export async function logSet(sessionId: string, input: LogSetInput): Promise<void> {
  const { session } = await requireOwnedSession(sessionId);
  if (session.status !== "in_progress") throw new Error("Session is not in progress");

  await db.insert(sessionSets).values({
    sessionId,
    exerciseId: input.exerciseId,
    setNumber: input.setNumber,
    weight: input.weight === null ? null : String(input.weight),
    weightUnit: input.weightUnit,
    reps: input.reps,
    notes: input.notes,
  });

  revalidatePath(`/session/${sessionId}`);
}

/** Deletes the most recently logged set for a given exercise — an undo for a
 * mis-tapped entry. Session progress re-derives itself automatically once
 * the row is gone. */
export async function deleteLastSet(sessionId: string, exerciseId: string): Promise<void> {
  const { session } = await requireOwnedSession(sessionId);
  if (session.status !== "in_progress") throw new Error("Session is not in progress");

  const rows = await db.select().from(sessionSets).where(eq(sessionSets.sessionId, sessionId));
  const forExercise = rows
    .filter((r) => r.exerciseId === exerciseId)
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  if (forExercise.length === 0) return;

  await db.delete(sessionSets).where(eq(sessionSets.id, forExercise[0].id));
  revalidatePath(`/session/${sessionId}`);
}

export async function completeSession(sessionId: string): Promise<never> {
  await requireOwnedSession(sessionId);
  await db.update(sessions).set({ status: "completed", completedAt: new Date() }).where(eq(sessions.id, sessionId));
  revalidatePath("/workouts");
  redirect(`/session/${sessionId}`);
}

export async function abandonSession(sessionId: string): Promise<never> {
  await requireOwnedSession(sessionId);
  await db.update(sessions).set({ status: "abandoned", completedAt: new Date() }).where(eq(sessions.id, sessionId));
  revalidatePath("/workouts");
  redirect("/workouts");
}
