CREATE TYPE "tracker_item_type" AS ENUM('school', 'clinic', 'audition', 'application', 'deadline');--> statement-breakpoint
CREATE TABLE "dancer_program_views" (
	"dancer_id" uuid,
	"school_id" uuid,
	"first_viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dancer_program_views_pkey" PRIMARY KEY("dancer_id","school_id")
);
--> statement-breakpoint
CREATE TABLE "premium_roadmaps" (
	"user_id" uuid PRIMARY KEY,
	"roadmap_version" integer NOT NULL,
	"premium_started_at" timestamp with time zone NOT NULL,
	"first_viewed_at" timestamp with time zone,
	"profile_completed_at" timestamp with time zone,
	"video_completed_at" timestamp with time zone,
	"program_views_completed_at" timestamp with time zone,
	"tracker_completed_at" timestamp with time zone,
	"favorite_completed_at" timestamp with time zone,
	"roadmap_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracker_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"dancer_id" uuid NOT NULL,
	"type" "tracker_item_type" NOT NULL,
	"title" text NOT NULL,
	"school" text,
	"date" date,
	"notes" text,
	"stage" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracker_items_stage_nonnegative" CHECK ("stage" >= 0)
);
--> statement-breakpoint
CREATE TABLE "tracker_section_orders" (
	"dancer_id" uuid PRIMARY KEY,
	"sections" jsonb DEFAULT '[]' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "dancer_program_views_school_id_index" ON "dancer_program_views" ("school_id");--> statement-breakpoint
CREATE INDEX "tracker_items_dancer_id_created_at_index" ON "tracker_items" ("dancer_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tracker_items_dancer_school_journey" ON "tracker_items" ("dancer_id","school") WHERE "type" = 'school';--> statement-breakpoint
ALTER TABLE "dancer_program_views" ADD CONSTRAINT "dancer_program_views_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dancer_program_views" ADD CONSTRAINT "dancer_program_views_school_id_school_profiles_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "premium_roadmaps" ADD CONSTRAINT "premium_roadmaps_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tracker_items" ADD CONSTRAINT "tracker_items_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tracker_section_orders" ADD CONSTRAINT "tracker_section_orders_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;
