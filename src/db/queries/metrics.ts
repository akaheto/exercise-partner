import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { exerciseMuscles, sessions, sessionSets, sourceMuscles } from "@/db/schema";
import type { MuscleVolumePoint } from "@/domain/training-metrics";

/** One row per (logged set, primary muscle) for a profile — secondary and
 * stabilizer muscles are excluded so a compound lift's volume isn't counted
 * again for every muscle it merely assists. The raw shape Epic J1's weekly
 * bucketing consumes. */
export async function getMuscleVolumePoints(profileId: string): Promise<MuscleVolumePoint[]> {
  const rows = await db
    .select({
      muscle: sourceMuscles.canonicalName,
      date: sessionSets.completedAt,
      weight: sessionSets.weight,
      reps: sessionSets.reps,
    })
    .from(sessionSets)
    .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
    .innerJoin(
      exerciseMuscles,
      and(eq(exerciseMuscles.exerciseId, sessionSets.exerciseId), eq(exerciseMuscles.role, "primary")),
    )
    .innerJoin(sourceMuscles, eq(sourceMuscles.muscleId, exerciseMuscles.muscleId))
    .where(eq(sessions.profileId, profileId));

  return rows.map((r) => ({
    muscle: r.muscle,
    date: r.date,
    sets: [{ weight: r.weight, reps: r.reps }],
  }));
}
