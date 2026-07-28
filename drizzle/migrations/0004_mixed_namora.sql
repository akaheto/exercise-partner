-- Drop old single-table approach
DROP TABLE IF EXISTS "exercise_guidance" CASCADE;

-- Create guidance_patterns table (15 rows: 3 levels × 5 goals)
CREATE TABLE "guidance_patterns" (
  "id" text PRIMARY KEY,
  "experience_level" text NOT NULL,
  "training_goal" text NOT NULL,
  "recommended_sets" integer NOT NULL,
  "recommended_reps_min" integer NOT NULL,
  "recommended_reps_max" integer NOT NULL,
  "target_rpe" integer NOT NULL,
  "tempo" text NOT NULL,
  "breathing_cue" text NOT NULL,
  "form_cue" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE("experience_level", "training_goal")
);

-- Create exercise_guidance_overrides table (1,218 rows: one per exercise)
CREATE TABLE "exercise_guidance_overrides" (
  "id" SERIAL PRIMARY KEY,
  "exercise_id" text NOT NULL UNIQUE REFERENCES "source_exercises"("exercise_id") ON DELETE CASCADE,
  "pattern_id" text NOT NULL REFERENCES "guidance_patterns"("id"),

  -- Regression tiers (exercise-specific overrides)
  "regression_tier_1_exercise_id" text REFERENCES "source_exercises"("exercise_id"),
  "regression_tier_1_note" text,
  "regression_tier_2_exercise_id" text REFERENCES "source_exercises"("exercise_id"),
  "regression_tier_2_note" text,
  "regression_tier_3_exercise_id" text REFERENCES "source_exercises"("exercise_id"),
  "regression_tier_3_note" text,

  -- Equipment alternatives (exercise-specific)
  "alternative_1_exercise_id" text REFERENCES "source_exercises"("exercise_id"),
  "alternative_1_note" text,
  "alternative_2_exercise_id" text REFERENCES "source_exercises"("exercise_id"),
  "alternative_2_note" text,

  -- Safety/mobility (exercise-specific)
  "required_mobility" text,
  "contraindicated_for" text,
  "minimum_experience_level" text,

  -- Form cues (exercise-specific)
  "exercise_specific_form_cue" text,
  "beginner_safety_cue" text,

  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for efficient lookups
CREATE INDEX "idx_guidance_patterns_level_goal" ON "guidance_patterns"("experience_level", "training_goal");
CREATE INDEX "idx_exercise_guidance_overrides_pattern_id" ON "exercise_guidance_overrides"("pattern_id");
CREATE INDEX "idx_exercise_guidance_overrides_exercise_id" ON "exercise_guidance_overrides"("exercise_id");
