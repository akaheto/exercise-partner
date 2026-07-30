CREATE TABLE "client_errors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "client_errors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"profile_id" uuid,
	"message" text NOT NULL,
	"stack" text,
	"url" text,
	"user_agent" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "source_workout_programs" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "client_errors" ADD CONSTRAINT "client_errors_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;