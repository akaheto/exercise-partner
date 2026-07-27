ALTER TABLE "source_relationships" DROP CONSTRAINT "source_relationships_from_exercise_id_source_exercises_exercise_id_fk";
--> statement-breakpoint
ALTER TABLE "source_relationships" DROP CONSTRAINT "source_relationships_to_exercise_id_source_exercises_exercise_id_fk";
--> statement-breakpoint
ALTER TABLE "exercise_equipment" DROP CONSTRAINT "exercise_equipment_exercise_id_source_exercises_exercise_id_fk";
--> statement-breakpoint
ALTER TABLE "exercise_links" DROP CONSTRAINT "exercise_links_from_exercise_id_source_exercises_exercise_id_fk";
--> statement-breakpoint
ALTER TABLE "exercise_links" DROP CONSTRAINT "exercise_links_to_exercise_id_source_exercises_exercise_id_fk";
--> statement-breakpoint
ALTER TABLE "exercise_muscles" DROP CONSTRAINT "exercise_muscles_exercise_id_source_exercises_exercise_id_fk";
--> statement-breakpoint
ALTER TABLE "equipment_inventory" DROP CONSTRAINT "equipment_inventory_profile_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "exercise_overrides" DROP CONSTRAINT "exercise_overrides_exercise_id_source_exercises_exercise_id_fk";
--> statement-breakpoint
ALTER TABLE "exercise_overrides" DROP CONSTRAINT "exercise_overrides_profile_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "session_sets" DROP CONSTRAINT "session_sets_session_id_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_profile_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_workout_id_workouts_id_fk";
--> statement-breakpoint
ALTER TABLE "workout_blocks" DROP CONSTRAINT "workout_blocks_workout_id_workouts_id_fk";
--> statement-breakpoint
ALTER TABLE "workout_items" DROP CONSTRAINT "workout_items_block_id_workout_blocks_id_fk";
--> statement-breakpoint
ALTER TABLE "workouts" DROP CONSTRAINT "workouts_profile_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "source_relationships" ADD CONSTRAINT "source_relationships_from_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("from_exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_relationships" ADD CONSTRAINT "source_relationships_to_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("to_exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_equipment" ADD CONSTRAINT "exercise_equipment_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_links" ADD CONSTRAINT "exercise_links_from_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("from_exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_links" ADD CONSTRAINT "exercise_links_to_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("to_exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_muscles" ADD CONSTRAINT "exercise_muscles_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_inventory" ADD CONSTRAINT "equipment_inventory_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_overrides" ADD CONSTRAINT "exercise_overrides_exercise_id_source_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."source_exercises"("exercise_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_overrides" ADD CONSTRAINT "exercise_overrides_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_blocks" ADD CONSTRAINT "workout_blocks_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_items" ADD CONSTRAINT "workout_items_block_id_workout_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."workout_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;