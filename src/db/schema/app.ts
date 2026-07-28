import {
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sourceEquipment, sourceExercises } from "./source";

/**
 * Curation tracking: monitors progress on populating exercise content
 * (instructions, starting_position) from the source site.
 */
export const curationStatus = pgTable("curation_status", {
  exerciseId: text("exercise_id")
    .primaryKey()
    .references(() => sourceExercises.exerciseId, { onDelete: "cascade" }),

  // Instructions
  instructionsStatus: text("instructions_status")
    .notNull()
    .default("not_started"), // not_started | fetching | fetch_failed | needs_review | approved
  instructionsSource: text("instructions_source"), // muscleandstrength_scraped | manual | ai_generated | etc.
  instructionsFetchedAt: timestamp("instructions_fetched_at", {
    withTimezone: true,
  }),
  instructionsFetchError: text("instructions_fetch_error"),

  // Starting position
  startingPositionStatus: text("starting_position_status")
    .notNull()
    .default("not_started"),
  startingPositionSource: text("starting_position_source"),
  startingPositionFetchedAt: timestamp("starting_position_fetched_at", {
    withTimezone: true,
  }),
  startingPositionFetchError: text("starting_position_fetch_error"),

  // Metadata
  notes: text("notes"),
  lastAttemptedAt: timestamp("last_attempted_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * App layer: everything the app or its users create. Never touched by the
 * import pipeline — this is what exercise_overrides, workouts and history
 * are protected from being clobbered by a spreadsheet re-import.
 *
 * Top-level entities addressed by URL (profiles, workouts, sessions) use uuid
 * primary keys; child rows use identity integers.
 */

/** Lightweight — no credentials. The site itself is protected by a single
 * shared password (middleware); a profile just scopes data to a person. */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  preferredWeightUnit: text("preferred_weight_unit").notNull().default("kg"), // "kg" | "lb"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Sparse per-field corrections layered over source_exercises at read time
 * (see src/domain/mergeOverrides.ts). A null profileId is a global override,
 * visible to every profile; a set profileId is personal to that profile.
 */
export const exerciseOverrides = pgTable("exercise_overrides", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => sourceExercises.exerciseId, { onDelete: "cascade" }),
  profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "cascade" }),
  field: text("field").notNull(), // matches a sourceExercises column name, e.g. "instructions"
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Exercise guidance indexed by both experience level AND training goal.
 * Allows the app to tailor prescription based on:
 * - Experience Level: Beginner | Intermediate | Advanced
 * - Training Goal: Strength | Hypertrophy | Endurance | Power | General
 *
 * When a user selects (e.g.) "Intermediate" + "Hypertrophy", the app queries
 * for matching rows to get: sets, reps, RPE, tempo, breathing cues, regressions.
 */
export const exerciseGuidance = pgTable(
  "exercise_guidance",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => sourceExercises.exerciseId, { onDelete: "cascade" }),
    experienceLevel: text("experience_level").notNull(), // "Beginner" | "Intermediate" | "Advanced"
    trainingGoal: text("training_goal").notNull(), // "Strength" | "Hypertrophy" | "Endurance" | "Power" | "General"

    // Rep range guidance
    recommendedSets: integer("recommended_sets"),
    recommendedRepsMin: integer("recommended_reps_min"),
    recommendedRepsMax: integer("recommended_reps_max"),

    // Load/Intensity guidance (RPE: 1-10 scale, nullable for SMR/warmup)
    targetRpe: integer("target_rpe"),

    // Tempo guidance (eccentric-isometric-concentric, e.g., "3-0-1")
    tempo: text("tempo"),

    // Breathing cue
    breathingCue: text("breathing_cue"),

    // Regression option for when this exercise is too difficult
    regressionExerciseId: text("regression_exercise_id").references(
      () => sourceExercises.exerciseId
    ),
    regressionDescription: text("regression_description"),

    // Equipment alternatives if prescribed equipment unavailable
    equipmentAlternatives: jsonb("equipment_alternatives"),

    // Additional form cues and modifications
    formCue: text("form_cue"),
    modificationNote: text("modification_note"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({
      columns: [t.exerciseId, t.experienceLevel, t.trainingGoal],
    }),
  ]
);

/** What a profile actually has access to. Drives generator filtering (Epic F). */
export const equipmentInventory = pgTable(
  "equipment_inventory",
  {
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    equipmentId: text("equipment_id")
      .notNull()
      .references(() => sourceEquipment.equipmentId),
    status: text("status").notNull().default("have"), // "have" | "no"
    notes: text("notes"),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.equipmentId] })],
);

/**
 * Workout templates. Editing a saved workout creates a new version (parentWorkoutId
 * points at the original) rather than mutating in place, so sessions recorded
 * against an earlier version stay meaningful. See TECHNICAL_SPEC "History integrity".
 */
export const workouts = pgTable("workouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  version: integer("version").notNull().default(1),
  parentWorkoutId: uuid("parent_workout_id"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Grouping layer — a single exercise, or a superset/circuit of several. */
export const workoutBlocks = pgTable("workout_blocks", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  kind: text("kind").notNull().default("single"), // "single" | "superset" | "circuit"
  restSeconds: integer("rest_seconds"),
});

/** One prescribed exercise within a block. */
export const workoutItems = pgTable("workout_items", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  blockId: integer("block_id")
    .notNull()
    .references(() => workoutBlocks.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => sourceExercises.exerciseId),
  position: integer("position").notNull(),
  sets: integer("sets").notNull(),
  repsMin: integer("reps_min"),
  repsMax: integer("reps_max"),
  restSeconds: integer("rest_seconds"),
  notes: text("notes"),
});

/**
 * One performance of a workout. workoutSnapshot captures the workout's blocks/items
 * exactly as they were at start time, so a later template edit never changes what
 * this session is understood to have prescribed.
 */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  // set null (not cascade): workoutSnapshot already has everything needed to
  // display this session, so deleting the template must never delete history.
  workoutId: uuid("workout_id").references(() => workouts.id, { onDelete: "set null" }),
  workoutSnapshot: jsonb("workout_snapshot"),
  status: text("status").notNull().default("in_progress"), // "in_progress" | "completed" | "abandoned"
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

/**
 * The actual recorded performance. References exerciseId directly (not
 * workoutItemId) so a set stays meaningful even if the block or item that
 * prescribed it is later deleted from the template.
 */
export const sessionSets = pgTable("session_sets", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => sourceExercises.exerciseId),
  setNumber: integer("set_number").notNull(),
  weight: numeric("weight", { precision: 7, scale: 2 }),
  weightUnit: text("weight_unit"), // "kg" | "lb" — recorded alongside the value to avoid conversion drift
  reps: integer("reps"),
  rpe: numeric("rpe", { precision: 3, scale: 1 }),
  notes: text("notes"),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});
