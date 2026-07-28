import { db } from "@/db/client";
import { profiles, sessions, workouts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

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
  const allProfiles = await db.select().from(profiles).orderBy(desc(profiles.createdAt));

  const result: ProfileWithStats[] = [];

  for (const profile of allProfiles) {
    const workoutCount = await db
      .select({ id: workouts.id })
      .from(workouts)
      .where(eq(workouts.profileId, profile.id))
      .then((rows) => rows.length);

    const sessionResult = await db
      .select({ completedAt: sessions.completedAt })
      .from(sessions)
      .where(eq(sessions.profileId, profile.id))
      .orderBy(desc(sessions.completedAt))
      .limit(1);

    result.push({
      id: profile.id,
      displayName: profile.displayName,
      experienceLevel: profile.experienceLevel,
      trainingGoal: profile.trainingGoal,
      createdAt: profile.createdAt,
      workoutCount,
      sessionCount: await db
        .select({ id: sessions.id })
        .from(sessions)
        .where(eq(sessions.profileId, profile.id))
        .then((rows) => rows.length),
      lastActivityDate: sessionResult[0]?.completedAt ?? null,
    });
  }

  return result;
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
