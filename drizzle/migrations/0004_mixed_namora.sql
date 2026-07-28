CREATE TABLE "exercise_guidance" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "exercise_guidance_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"exercise_id" text NOT NULL,
	"experience_level" text NOT NULL,
	"training_goal" text NOT NULL,
	"recommended_sets" integer,
	"recommended_reps_min" integer,
	"recommended_reps_max" integer,
	"target_rpe" integer,
	"tempo" text,
	"breathing_cue" text,
	"regression_exercise_id" text,
	"regression_description" text,
	"equipment_alternatives" jsonb,
	"form_cue" text,
	"modification_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_guidance_exercise_id_experience_level_training_goal_pk" PRIMARY KEY("exercise_id","experience_level","training_goal")
);
--> statement-breakpoint
ALTER TABLE "exercise_guidance" ADD CONSTRAINT "exercise_guidance_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_guidance" ADD CONSTRAINT "exercise_guidance_regression_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("regression_exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE no action ON UPDATE no action;