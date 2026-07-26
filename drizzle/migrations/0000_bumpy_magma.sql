CREATE TABLE "source_equipment" (
	"equipment_id" text PRIMARY KEY NOT NULL,
	"canonical_name" text NOT NULL,
	"source_native" boolean DEFAULT true NOT NULL,
	"description" text,
	CONSTRAINT "source_equipment_canonical_name_unique" UNIQUE("canonical_name")
);
--> statement-breakpoint
CREATE TABLE "source_exercises" (
	"exercise_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"video_available" boolean DEFAULT false NOT NULL,
	"video_url" text,
	"thumbnail_url" text,
	"primary_muscle" text,
	"secondary_muscles" text,
	"stabilizer_muscles" text,
	"equipment" text,
	"exercise_type" text,
	"mechanics" text,
	"force" text,
	"experience_level" text,
	"starting_position" text,
	"movement_pattern" text,
	"range_of_motion" text,
	"instructions" text,
	"tips" text,
	"common_mistakes" text,
	"breathing" text,
	"variations_raw" text,
	"alternatives_raw" text,
	"progression_raw" text,
	"regression_raw" text,
	"images_available" boolean DEFAULT false NOT NULL,
	"number_of_images" integer DEFAULT 0 NOT NULL,
	"gif_available" boolean DEFAULT false NOT NULL,
	"muscle_groups_tag" text,
	"equipment_tags_tag" text,
	"movement_tags_tag" text,
	"compound_isolation" text,
	"last_verified" timestamp with time zone,
	"source" text,
	"horizontal_push" boolean DEFAULT false NOT NULL,
	"vertical_push" boolean DEFAULT false NOT NULL,
	"horizontal_pull" boolean DEFAULT false NOT NULL,
	"vertical_pull" boolean DEFAULT false NOT NULL,
	"squat" boolean DEFAULT false NOT NULL,
	"hinge" boolean DEFAULT false NOT NULL,
	"carry" boolean DEFAULT false NOT NULL,
	"rotation" boolean DEFAULT false NOT NULL,
	"anti_rotation" boolean DEFAULT false NOT NULL,
	"core" boolean DEFAULT false NOT NULL,
	"unilateral_bilateral" text,
	"body_position" text,
	"body_region" text,
	"single_joint_multi_joint" text,
	"left_right_both" text,
	"mobility_required" text,
	"balance_required" text,
	"derived_status" text,
	"source_row_hash" text NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_muscles" (
	"muscle_id" text PRIMARY KEY NOT NULL,
	"canonical_name" text NOT NULL,
	"source" text,
	CONSTRAINT "source_muscles_canonical_name_unique" UNIQUE("canonical_name")
);
--> statement-breakpoint
CREATE TABLE "source_relationships" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "source_relationships_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"from_exercise_id" text NOT NULL,
	"to_exercise_id" text NOT NULL,
	"relationship_type" text NOT NULL,
	"similarity_score" integer NOT NULL,
	"evidence_type" text,
	"evidence_url" text,
	"review_status" text DEFAULT 'Unreviewed' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "exercise_equipment" (
	"exercise_id" text NOT NULL,
	"equipment_id" text NOT NULL,
	CONSTRAINT "exercise_equipment_exercise_id_equipment_id_pk" PRIMARY KEY("exercise_id","equipment_id")
);
--> statement-breakpoint
CREATE TABLE "exercise_links" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "exercise_links_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"from_exercise_id" text NOT NULL,
	"relation_type" text NOT NULL,
	"label" text NOT NULL,
	"url" text,
	"to_exercise_id" text
);
--> statement-breakpoint
CREATE TABLE "exercise_muscles" (
	"exercise_id" text NOT NULL,
	"muscle_id" text NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "exercise_muscles_exercise_id_muscle_id_role_pk" PRIMARY KEY("exercise_id","muscle_id","role")
);
--> statement-breakpoint
CREATE TABLE "equipment_inventory" (
	"profile_id" uuid NOT NULL,
	"equipment_id" text NOT NULL,
	"status" text DEFAULT 'have' NOT NULL,
	"notes" text,
	CONSTRAINT "equipment_inventory_profile_id_equipment_id_pk" PRIMARY KEY("profile_id","equipment_id")
);
--> statement-breakpoint
CREATE TABLE "exercise_overrides" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "exercise_overrides_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"exercise_id" text NOT NULL,
	"profile_id" uuid,
	"field" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"avatar" text,
	"preferred_weight_unit" text DEFAULT 'kg' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_sets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "session_sets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"session_id" uuid NOT NULL,
	"exercise_id" text NOT NULL,
	"set_number" integer NOT NULL,
	"weight" numeric(7, 2),
	"weight_unit" text,
	"reps" integer,
	"rpe" numeric(3, 1),
	"notes" text,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"workout_id" uuid,
	"workout_snapshot" jsonb,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workout_blocks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "workout_blocks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"workout_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"kind" text DEFAULT 'single' NOT NULL,
	"rest_seconds" integer
);
--> statement-breakpoint
CREATE TABLE "workout_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "workout_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"block_id" integer NOT NULL,
	"exercise_id" text NOT NULL,
	"position" integer NOT NULL,
	"sets" integer NOT NULL,
	"reps_min" integer,
	"reps_max" integer,
	"rest_seconds" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_workout_id" uuid,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "source_relationships" ADD CONSTRAINT "source_relationships_from_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("from_exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_relationships" ADD CONSTRAINT "source_relationships_to_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("to_exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_equipment" ADD CONSTRAINT "exercise_equipment_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_equipment" ADD CONSTRAINT "exercise_equipment_equipment_id_source_equipment_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."source_equipment"("equipment_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_links" ADD CONSTRAINT "exercise_links_from_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("from_exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_links" ADD CONSTRAINT "exercise_links_to_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("to_exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_muscles" ADD CONSTRAINT "exercise_muscles_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_muscles" ADD CONSTRAINT "exercise_muscles_muscle_id_source_muscles_muscle_id_fk" FOREIGN KEY ("muscle_id") REFERENCES "public"."source_muscles"("muscle_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory" ADD CONSTRAINT "equipment_inventory_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory" ADD CONSTRAINT "equipment_inventory_equipment_id_source_equipment_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."source_equipment"("equipment_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_overrides" ADD CONSTRAINT "exercise_overrides_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_overrides" ADD CONSTRAINT "exercise_overrides_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_blocks" ADD CONSTRAINT "workout_blocks_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_items" ADD CONSTRAINT "workout_items_block_id_workout_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."workout_blocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_items" ADD CONSTRAINT "workout_items_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;