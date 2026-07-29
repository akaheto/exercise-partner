ALTER TABLE "profiles" ADD COLUMN "pin_salt" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "pin_failed_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "pin_locked_until" timestamp with time zone;--> statement-breakpoint
-- Backfill, not a reset. Every existing pin_hash was computed with the old
-- hardcoded salt ("exercise-partner-salt", src/lib/pin.ts before this
-- migration); recording that value explicitly per row is what lets an
-- existing profile's PIN keep verifying after this migration, instead of
-- silently locking everyone out of deleting their own profile. This does not
-- make a pre-existing PIN any less guessable than it already was — that
-- history can't be undone without forcing a reset, which there is currently
-- no UI for — it only stops things from getting *worse*. Every profile
-- created after this migration gets a genuinely random salt via
-- generatePinSalt(). See PROJECT_PLAN.docx section 4, assumption 35.
UPDATE "profiles" SET "pin_salt" = 'exercise-partner-salt'
WHERE "pin_hash" IS NOT NULL AND "pin_salt" IS NULL;