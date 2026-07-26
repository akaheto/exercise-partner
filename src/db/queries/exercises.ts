import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import { exerciseOverrides, sourceExercises } from "@/db/schema";
import { mergeOverrides } from "@/domain/mergeOverrides";

/**
 * Fetches a single exercise with any applicable overrides merged in — the
 * read-time half of the two-layer data principle. Returns null if no exercise
 * with that id exists. See src/domain/mergeOverrides.ts for the (unit-tested)
 * merge logic; this wrapper is intentionally thin.
 */
export async function getExerciseById(exerciseId: string, profileId: string | null = null) {
  const [source] = await db.select().from(sourceExercises).where(eq(sourceExercises.exerciseId, exerciseId));
  if (!source) return null;

  const overrideRows = await db
    .select({
      field: exerciseOverrides.field,
      value: exerciseOverrides.value,
      profileId: exerciseOverrides.profileId,
    })
    .from(exerciseOverrides)
    .where(
      and(
        eq(exerciseOverrides.exerciseId, exerciseId),
        profileId
          ? or(isNull(exerciseOverrides.profileId), eq(exerciseOverrides.profileId, profileId))
          : isNull(exerciseOverrides.profileId),
      ),
    );

  return mergeOverrides(source, overrideRows, profileId);
}
