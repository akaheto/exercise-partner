CREATE TABLE "source_workout_program_days" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "source_workout_program_days_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"program_id" text NOT NULL,
	"day_number" integer NOT NULL,
	"is_rest_day" boolean DEFAULT false NOT NULL,
	"focus" text
);
--> statement-breakpoint
CREATE TABLE "source_workout_program_exercises" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "source_workout_program_exercises_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"program_day_id" integer NOT NULL,
	"position" integer NOT NULL,
	"exercise_id" text,
	"exercise_name_raw" text NOT NULL,
	"exercise_url_raw" text,
	"sets" text,
	"reps" text,
	"rest" text
);
--> statement-breakpoint
CREATE TABLE "source_workout_programs" (
	"program_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"main_goal" text,
	"workout_type" text,
	"training_level" text,
	"duration_weeks" integer,
	"days_per_week" integer,
	"time_per_workout" text,
	"equipment_needed" text,
	"target_gender" text,
	"source_row_hash" text NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_workout_programs_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "source_workout_program_days" ADD CONSTRAINT "source_workout_program_days_program_id_source_workout_programs_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."source_workout_programs"("program_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_workout_program_exercises" ADD CONSTRAINT "source_workout_program_exercises_program_day_id_source_workout_program_days_id_fk" FOREIGN KEY ("program_day_id") REFERENCES "public"."source_workout_program_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_workout_program_exercises" ADD CONSTRAINT "source_workout_program_exercises_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE no action ON UPDATE no action;