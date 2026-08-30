import { db } from "@/db/client";
import { profiles, sessions, workouts } from "@/db/schema";
import { count, desc, eq, max } from "drizzle-orm";

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

  const workoutCount = await db
    .select({ id: workouts.id })
    .from(workouts)
    .where(eq(workouts.profileId, profileId))
    .then((rows) => rows.length);

  const sessionCount = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.profileId, profileId))
    .then((rows) => rows.length);

  const completedSessionCount = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.profileId, profileId))
    .then((rows) => rows.filter((s) => s.id).length); // This is simplified

  return {
    profile,
    workoutCount,
    sessionCount,
    completedSessionCount,
    totalVolume: 0, // Could be calculated if needed
  };
}
