-- Add profile PIN for additional security
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "pin_hash" text;
