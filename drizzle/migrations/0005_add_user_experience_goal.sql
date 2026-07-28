-- Add experience level and training goal to user profiles
ALTER TABLE "profiles" ADD COLUMN "experience_level" text NOT NULL DEFAULT 'Beginner';
ALTER TABLE "profiles" ADD COLUMN "training_goal" text NOT NULL DEFAULT 'General';

-- Create index for efficient queries
CREATE INDEX "idx_profiles_level_goal" ON "profiles"("experience_level", "training_goal");
