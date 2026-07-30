import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Source layer: a mirror of the exercise research spreadsheet.
 *
 * These tables are rebuilt by the import pipeline (scripts/import-exercises.ts)
 * on every run and must never be hand-edited or written to by the app. User
 * corrections belong in exercise_overrides (see app.ts), which is layered over
 * this data at read time. See TECHNICAL_SPEC.docx section 2, "The two-layer
 * data principle".
 */

/** 29-row canonical equipment list (Equipment Taxonomy sheet). */
export const sourceEquipment = pgTable("source_equipment", {
  equipmentId: text("equipment_id").primaryKey(), // e.g. "EQ-001"
  canonicalName: text("canonical_name").notNull().unique(),
  sourceNative: boolean("source_native").notNull().default(true),
  description: text("description"),
});

/**
 * Canonical muscle list (Muscle Taxonomy sheet, 22 rows). The import pipeline
 * additionally appends any muscle name encountered in Source Exercises that
 * is not in the original taxonomy (e.g. "Middle Back") rather than dropping
 * it, so no source data is silently lost — see TECHNICAL_SPEC known limitations.
 */
export const sourceMuscles = pgTable("source_muscles", {
  muscleId: text("muscle_id").primaryKey(), // e.g. "MU-001"
  canonicalName: text("canonical_name").notNull().unique(),
  source: text("source"),
});

/**
 * Direct mirror of the "Source Exercises" sheet (52 columns, 1,218 rows).
 * Column names follow the spreadsheet's Data Dictionary categories: Identification,
 * Muscles, Classification, Execution, Relationships, Media, Search Tags, Metadata,
 * and Derived Fields (the rule-derived movement-pattern booleans, kept distinct
 * from directly-sourced facts per the Data Dictionary's own definition).
 */
export const sourceExercises = pgTable("source_exercises", {
  exerciseId: text("exercise_id").primaryKey(), // e.g. "EX-0001"

  // Identification
  name: text("name").notNull(),
  url: text("url"),
  videoAvailable: boolean("video_available").notNull().default(false),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),

  // Muscles (raw source text — normalised into exercise_muscles at import)
  primaryMuscle: text("primary_muscle"),
  secondaryMuscles: text("secondary_muscles"), // comma-delimited, e.g. "Shoulders, Triceps"
  stabilizerMuscles: text("stabilizer_muscles"), // unpopulated in v1 source data; kept for future imports

  // Classification (raw source text — equipment normalised into exercise_equipment at import)
  equipment: text("equipment"),
  exerciseType: text("exercise_type"),
  mechanics: text("mechanics"),
  force: text("force"),
  experienceLevel: text("experience_level"),

  // Execution
  startingPosition: text("starting_position"),
  rangeOfMotion: text("range_of_motion"),
  instructions: text("instructions"),
  tips: text("tips"),
  commonMistakes: text("common_mistakes"),

  // Relationships — raw "label | url; label2 | url2" text, parsed into exercise_links at import
  variationsRaw: text("variations_raw"),
  alternativesRaw: text("alternatives_raw"),
  progressionRaw: text("progression_raw"),
  regressionRaw: text("regression_raw"),

  // Media
  imagesAvailable: boolean("images_available").notNull().default(false),
  numberOfImages: integer("number_of_images").notNull().default(0),
  gifAvailable: boolean("gif_available").notNull().default(false),

  // Search tags (pre-computed in the source; the app also derives its own filters
  // from the normalised muscle/equipment tables rather than parsing these)
  muscleGroupsTag: text("muscle_groups_tag"),
  equipmentTagsTag: text("equipment_tags_tag"),
  movementTagsTag: text("movement_tags_tag"),
  compoundIsolation: text("compound_isolation"), // "Compound" | "Isolation"

  // Metadata
  lastVerified: timestamp("last_verified", { withTimezone: true }),
  source: text("source"),

  // Derived fields — rule-derived, unreviewed. Never presented as sourced fact.
  horizontalPush: boolean("horizontal_push").notNull().default(false),
  verticalPush: boolean("vertical_push").notNull().default(false),
  horizontalPull: boolean("horizontal_pull").notNull().default(false),
  verticalPull: boolean("vertical_pull").notNull().default(false),
  squat: boolean("squat").notNull().default(false),
  hinge: boolean("hinge").notNull().default(false),
  carry: boolean("carry").notNull().default(false),
  rotation: boolean("rotation").notNull().default(false),
  antiRotation: boolean("anti_rotation").notNull().default(false),
  core: boolean("core").notNull().default(false),
  unilateralBilateral: text("unilateral_bilateral"),
  bodyPosition: text("body_position"),
  bodyRegion: text("body_region"),
  singleJointMultiJoint: text("single_joint_multi_joint"),
  leftRightBoth: text("left_right_both"),
  mobilityRequired: text("mobility_required"), // "Low" | "Medium" | "High"
  balanceRequired: text("balance_required"), // "Low" | "Medium" | "High"
  derivedStatus: text("derived_status"), // e.g. "Rule Derived - Unreviewed"

  /**
   * Hash of the row's content as imported, used to detect real changes on
   * re-import without a full column-by-column diff. Not derived from spreadsheet
   * data — an import-pipeline implementation detail.
   */
  sourceRowHash: text("source_row_hash").notNull(),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Pre-computed substitution candidates (Exercise Relationships sheet, 3,638 rows).
 * All rows currently carry relationship_type "Candidate Alternative" and review
 * status "Unreviewed" — presented to users as suggestions, never equivalences.
 */
export const sourceRelationships = pgTable("source_relationships", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  fromExerciseId: text("from_exercise_id")
    .notNull()
    .references(() => sourceExercises.exerciseId, { onDelete: "cascade" }),
  toExerciseId: text("to_exercise_id")
    .notNull()
    .references(() => sourceExercises.exerciseId, { onDelete: "cascade" }),
  relationshipType: text("relationship_type").notNull(),
  similarityScore: integer("similarity_score").notNull(),
  evidenceType: text("evidence_type"),
  evidenceUrl: text("evidence_url"),
  reviewStatus: text("review_status").notNull().default("Unreviewed"),
  notes: text("notes"),
});

/**
 * Epic Q — packaged multi-day workout programs (muscleandstrength.com/workouts),
 * imported by scripts/import-workout-programs.ts. Same two-layer principle as
 * the exercise data: this is the source layer, rebuilt on re-import; "add to
 * my workouts" (src/app/(app)/build/library/actions.ts) copies a program's
 * days into the app-owned workouts/workout_blocks/workout_items tables,
 * which this layer never touches once copied.
 *
 * Reconnaissance across four structurally different real programs (see
 * PROJECT_PLAN.docx Epic Q) found no fixed vocabulary for day naming
 * (muscle group, day-of-week, movement pattern, and lettered variants all
 * appear) and an inconsistent exercise-table column set (a "Rest" column is
 * sometimes present, sometimes not) — both kept as free text rather than
 * enums or typed columns for that reason. A "12-week" program was confirmed
 * to be one weekly split repeated for 12 weeks, progressed by adding load,
 * not 12 different weeks of content — so there is deliberately no week
 * dimension here, only a repeating day pattern plus a duration in weeks.
 */
export const sourceWorkoutPrograms = pgTable("source_workout_programs", {
  programId: text("program_id").primaryKey(), // e.g. "WP-0001"
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  description: text("description"),
  category: text("category"), // e.g. "Muscle Building", "Fat Loss", "Strength", "Home Workouts"
  mainGoal: text("main_goal"), // e.g. "Build Muscle", "Fat Loss", "Increase Strength"
  workoutType: text("workout_type"), // e.g. "Split", "Full Body"
  trainingLevel: text("training_level"), // "Beginner" | "Intermediate" | "Advanced"
  durationWeeks: integer("duration_weeks"), // null when the source doesn't state one
  daysPerWeek: integer("days_per_week"),
  timePerWorkout: text("time_per_workout"), // raw range string, e.g. "45-60 minutes"
  equipmentNeeded: text("equipment_needed"), // raw comma list, source's own wording
  targetGender: text("target_gender"), // "Male" | "Female" | "Male & Female"
  sourceRowHash: text("source_row_hash").notNull(),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per day of a program's weekly cycle, including rest days — kept
 * for fidelity to the source's own schedule rather than only storing
 * training days. day_number is 1-7 within one repeating week, never a
 * cross-week count. */
export const sourceWorkoutProgramDays = pgTable("source_workout_program_days", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  programId: text("program_id")
    .notNull()
    .references(() => sourceWorkoutPrograms.programId, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(),
  isRestDay: boolean("is_rest_day").notNull().default(false),
  focus: text("focus"), // e.g. "Back & Biceps", "Upper", "Push", "Upper A" — free text, no fixed vocabulary
});

/** One row per exercise prescribed on a training day. exerciseId is resolved
 * by matching the program page's exercise link against source_exercises.url
 * (same host, same /exercises/<slug> path the original spreadsheet import
 * already used) — kept nullable with the raw name/url preserved alongside
 * it, so a match failure loses nothing rather than silently dropping the row. */
export const sourceWorkoutProgramExercises = pgTable("source_workout_program_exercises", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  programDayId: integer("program_day_id")
    .notNull()
    .references(() => sourceWorkoutProgramDays.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  exerciseId: text("exercise_id").references(() => sourceExercises.exerciseId),
  exerciseNameRaw: text("exercise_name_raw").notNull(),
  exerciseUrlRaw: text("exercise_url_raw"),
  sets: text("sets"), // raw text — not always a clean integer
  reps: text("reps"), // raw text — "AMRAP", "5 Minute Burn", "8-12" all appear
  rest: text("rest"), // nullable — the Rest column isn't present on every source page
  notes: text("notes"), // trailing cell text after the exercise link, e.g. "- 3 sec negative"
});
