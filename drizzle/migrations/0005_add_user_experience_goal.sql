-- Add experience level and training goal to user profiles
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "experience_level" text NOT NULL DEFAULT 'Beginner';
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "training_goal" text NOT NULL DEFAULT 'General';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_profiles_level_goal" ON "profiles"("experience_level", "training_goal");
