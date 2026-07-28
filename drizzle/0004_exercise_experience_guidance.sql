-- Create exercise_guidance table for experience-level AND goal-specific guidance
-- This allows tailoring reps, sets, load, breathing cues, and regressions by both skill level and training goal
-- E.g., a Beginner doing Hypertrophy (Strength, Hypertrophy, Endurance, Power, or General)

CREATE TABLE exercise_guidance (
  id SERIAL PRIMARY KEY,
  exercise_id TEXT NOT NULL REFERENCES source_exercises(exercise_id) ON DELETE CASCADE,
  experience_level TEXT NOT NULL, -- 'Beginner' | 'Intermediate' | 'Advanced'
  training_goal TEXT NOT NULL, -- 'Strength' | 'Hypertrophy' | 'Endurance' | 'Power' | 'General'

  -- Rep range guidance
  recommended_sets INTEGER,
  recommended_reps_min INTEGER,
  recommended_reps_max INTEGER,

  -- Load/Intensity guidance (1-10 RPE scale, nullable for SMR/warmup)
  target_rpe INTEGER,

  -- Tempo guidance (e.g., "3-0-1" for eccentric-isometric-concentric)
  tempo TEXT,

  -- Breathing cue (e.g., "Inhale as you lower, exhale as you press")
  breathing_cue TEXT,

  -- Regression: exercise to use if this one is too hard
  regression_exercise_id TEXT REFERENCES source_exercises(exercise_id),
  regression_description TEXT,

  -- Equipment alternatives if prescribed equipment unavailable
  equipment_alternatives JSONB,

  -- Additional form cues and modifications
  form_cue TEXT,
  modification_note TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Composite primary key: each exercise has one row per (experience_level, training_goal) combination
  UNIQUE(exercise_id, experience_level, training_goal)
);

CREATE INDEX idx_exercise_guidance_exercise_id
  ON exercise_guidance(exercise_id);

CREATE INDEX idx_exercise_guidance_level_goal
  ON exercise_guidance(experience_level, training_goal);
