CREATE TABLE "curation_status" (
	"exercise_id" text PRIMARY KEY NOT NULL,
	"instructions_status" text DEFAULT 'not_started' NOT NULL,
	"instructions_source" text,
	"instructions_fetched_at" timestamp with time zone,
	"instructions_fetch_error" text,
	"starting_position_status" text DEFAULT 'not_started' NOT NULL,
	"starting_position_source" text,
	"starting_position_fetched_at" timestamp with time zone,
	"starting_position_fetch_error" text,
	"notes" text,
	"last_attempted_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "curation_status" ADD CONSTRAINT "curation_status_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE cascade ON UPDATE no action;