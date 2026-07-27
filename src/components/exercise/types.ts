import type { sourceExercises } from "@/db/schema";

/** The shape returned by listExercises/getExerciseById — a plain source_exercises row. */
export type SourceExerciseRow = typeof sourceExercises.$inferSelect;
