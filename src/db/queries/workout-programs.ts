import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  sourceExercises,
  sourceWorkoutProgramDays,
  sourceWorkoutProgramExercises,
  sourceWorkoutPrograms,
} from "@/db/schema";

export function listWorkoutPrograms() {
  return db.select().from(sourceWorkoutPrograms).orderBy(asc(sourceWorkoutPrograms.name));
}

/** Get all programs grouped by category, for hierarchical display. */
export async function listWorkoutProgramsByCategory() {
  const programs = await db
    .select()
    .from(sourceWorkoutPrograms)
    .orderBy(asc(sourceWorkoutPrograms.category), asc(sourceWorkoutPrograms.name));

  const grouped = new Map<string, typeof programs>();
  for (const prog of programs) {
    const cat = prog.category ?? "Other";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(prog);
  }

  // Return as array of categories with programs, sorted by category name
  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, programs]) => ({ category, programs }));
}

/** A program with its full day-by-day breakdown, exercises in position
 * order, joined to source_exercises where a match was found (see
 * scripts/import-workout-programs.ts). Returns null for an unknown id. */
export async function getWorkoutProgramWithDays(programId: string) {
  const [program] = await db
    .select()
    .from(sourceWorkoutPrograms)
    .where(eq(sourceWorkoutPrograms.programId, programId));
  if (!program) return null;

  const days = await db
    .select()
    .from(sourceWorkoutProgramDays)
    .where(eq(sourceWorkoutProgramDays.programId, programId))
    .orderBy(asc(sourceWorkoutProgramDays.dayNumber));

  const dayIds = days.map((d) => d.id);
  const exercisesByDay = new Map<number, (typeof sourceWorkoutProgramExercises.$inferSelect & { exerciseName: string | null })[]>();

  if (dayIds.length > 0) {
    const rows = await db
      .select({
        exercise: sourceWorkoutProgramExercises,
        exerciseName: sourceExercises.name,
      })
      .from(sourceWorkoutProgramExercises)
      .leftJoin(sourceExercises, eq(sourceWorkoutProgramExercises.exerciseId, sourceExercises.exerciseId))
      .where(inArray(sourceWorkoutProgramExercises.programDayId, dayIds))
      .orderBy(asc(sourceWorkoutProgramExercises.position));

    for (const row of rows) {
      const list = exercisesByDay.get(row.exercise.programDayId) ?? [];
      list.push({ ...row.exercise, exerciseName: row.exerciseName });
      exercisesByDay.set(row.exercise.programDayId, list);
    }
  }

  return {
    program,
    days: days.map((day) => ({
      ...day,
      exercises: exercisesByDay.get(day.id) ?? [],
    })),
  };
}
