import { and, asc, eq, ilike, inArray } from "drizzle-orm";
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

/** Get all programs grouped by category, for hierarchical display. The
 * goal/level/gender/duration/days badges (collapsed behind a "Filters"
 * disclosure on the page, not shown by default — "hide" meant collapsed,
 * not removed) and the free-text name search are independent and combine
 * with AND. */
export interface WorkoutProgramFilters {
  goal?: string;
  level?: string;
  gender?: string;
  duration?: string;
  days?: string;
  search?: string;
}

// Deliberately unpaginated: measured at 241ms for the full unfiltered query
// against 613 programs (2 September 2026, PROJECT_PLAN.docx section 4 item
// 58). Revisit with a limit/offset or virtualized list if that grows past
// ~1s or a few thousand programs — not worth the complexity before then.
export async function listWorkoutProgramsByCategory(filters?: WorkoutProgramFilters) {
  const conditions = [];
  if (filters?.goal) conditions.push(eq(sourceWorkoutPrograms.mainGoal, filters.goal));
  if (filters?.level) conditions.push(eq(sourceWorkoutPrograms.trainingLevel, filters.level));
  if (filters?.gender) conditions.push(eq(sourceWorkoutPrograms.targetGender, filters.gender));
  if (filters?.duration) conditions.push(eq(sourceWorkoutPrograms.durationWeeks, Number(filters.duration)));
  if (filters?.days) conditions.push(eq(sourceWorkoutPrograms.daysPerWeek, Number(filters.days)));
  // AND, not a single "%a b%" substring: "chest bodyweight" should match
  // "3 Dumbbell and Bodyweight Chest Workouts" even though the two words
  // don't appear adjacent or in that order in the name.
  if (filters?.search) {
    for (const word of filters.search.trim().split(/\s+/).filter(Boolean)) {
      conditions.push(ilike(sourceWorkoutPrograms.name, `%${word}%`));
    }
  }

  const query = db.select().from(sourceWorkoutPrograms);
  const programs = await (conditions.length > 0 ? query.where(and(...conditions)) : query).orderBy(
    asc(sourceWorkoutPrograms.category),
    asc(sourceWorkoutPrograms.name),
  );

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
