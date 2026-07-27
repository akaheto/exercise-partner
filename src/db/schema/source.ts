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
  movementPattern: text("movement_pattern"),
  rangeOfMotion: text("range_of_motion"),
  instructions: text("instructions"),
  tips: text("tips"),
  commonMistakes: text("common_mistakes"),
  breathing: text("breathing"),

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
