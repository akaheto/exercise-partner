-- Distinguishes "chose Beginner" from "never asked". experience_level and
-- training_goal default to Beginner/General, so neither can tell whether a
-- profile actually went through onboarding or was only ever created by
-- step 1 before the redirect bug (see PROJECT_PLAN.docx section 4, item 47)
-- cut the flow short.
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "onboarding_completed_at" timestamp with time zone;
