import { db } from "@/db/client";
import { profiles, sessions, sessionSets, workouts } from "@/db/schema";
import { computeVolume } from "@/domain/session-history";
import { and, count, desc, eq, max } from "drizzle-orm";

export interface ProfileWithStats {
  id: string;
  displayName: string;
  experienceLevel: string;
  trainingGoal: string;
  createdAt: Date;
  workoutCount: number;
  sessionCount: number;
  lastActivityDate: Date | null;
}

/**
 * Get all profiles with their statistics (admin only)
 */
export async function getAllProfilesWithStats(): Promise<ProfileWithStats[]> {
  // Three grouped queries (one per stat) instead of three per profile — the
  // previous version ran a query per profile per stat in a sequential loop,
  // which was 3xN round trips for N profiles.
  const [allProfiles, workoutCounts, sessionStats] = await Promise.all([
    db.select().from(profiles).orderBy(desc(profiles.createdAt)),
    db
      .select({ profileId: workouts.profileId, workoutCount: count() })
      .from(workouts)
      .groupBy(workouts.profileId),
    db
      .select({
        profileId: sessions.profileId,
        sessionCount: count(),
        lastActivityDate: max(sessions.completedAt),
      })
      .from(sessions)
      .groupBy(sessions.profileId),
  ]);

  const workoutCountByProfile = new Map(workoutCounts.map((w) => [w.profileId, w.workoutCount]));
  const sessionStatsByProfile = new Map(sessionStats.map((s) => [s.profileId, s]));

  return allProfiles.map((profile) => {
    const stats = sessionStatsByProfile.get(profile.id);
    return {
      id: profile.id,
      displayName: profile.displayName,
      experienceLevel: profile.experienceLevel,
      trainingGoal: profile.trainingGoal,
      createdAt: profile.createdAt,
      workoutCount: workoutCountByProfile.get(profile.id) ?? 0,
      sessionCount: stats?.sessionCount ?? 0,
      lastActivityDate: stats?.lastActivityDate ?? null,
    };
  });
}

/**
 * Get detailed profile information (admin only)
 */
export async function getProfileDetail(profileId: string): Promise<
  | {
      profile: (typeof profiles.$inferSelect);
      workoutCount: number;
      sessionCount: number;
      completedSessionCount: number;
      totalVolume: number;
    }
  | null
> {
  const profile = await db.select().from(profiles).where(eq(profiles.id, profileId)).then((rows) => rows[0]);

  if (!profile) {
    return null;
  }

  const [[workoutCountRow], [sessionCountRow], [completedSessionCountRow], volumeSets] = await Promise.all([
    db.select({ value: count() }).from(workouts).where(eq(workouts.profileId, profileId)),
    db.select({ value: count() }).from(sessions).where(eq(sessions.profileId, profileId)),
    db
      .select({ value: count() })
      .from(sessions)
      .where(and(eq(sessions.profileId, profileId), eq(sessions.status, "completed"))),
    // computeVolume (src/domain/session-history.ts) normalizes kg/lb the
    // same way the per-session history view does, so this total is
    // consistent with what a profile sees on their own history pages.
    db
      .select({ weight: sessionSets.weight, reps: sessionSets.reps, weightUnit: sessionSets.weightUnit })
      .from(sessionSets)
      .innerJoin(sessions, eq(sessionSets.sessionId, sessions.id))
      .where(eq(sessions.profileId, profileId)),
  ]);

  return {
    profile,
    workoutCount: workoutCountRow.value,
    sessionCount: sessionCountRow.value,
    completedSessionCount: completedSessionCountRow.value,
    totalVolume: computeVolume(volumeSets as Parameters<typeof computeVolume>[0]),
  };
}
