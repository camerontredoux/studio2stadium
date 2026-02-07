CREATE TYPE "account_type" AS ENUM('dancer', 'school');--> statement-breakpoint
CREATE TYPE "dance_event_type" AS ENUM('audition', 'rehearsal', 'recital', 'showcase', 'competition', 'class', 'intensive', 'workshop', 'fundraiser', 'combine', 'convention', 'clinic', 'deadline', 'recruitment', 'performance', 'camp', 'other');--> statement-breakpoint
CREATE TYPE "feed_item_type" AS ENUM('image_upload', 'video_upload', 'profile_update', 'reference_created', 'achievement_created');--> statement-breakpoint
CREATE TYPE "media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "platform_name" AS ENUM('core', 'prodigy');--> statement-breakpoint
CREATE TYPE "prospect_status" AS ENUM('pending', 'released', 'in_review', 'accepted');--> statement-breakpoint
CREATE TYPE "role" AS ENUM('admin', 'prodigy_admin', 'user');--> statement-breakpoint
CREATE TYPE "subscription_source" AS ENUM('stripe', 'revenuecat');--> statement-breakpoint
CREATE TABLE "dancer_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dancer_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"dancer_id" uuid NOT NULL,
	"media_id" text NOT NULL UNIQUE,
	"type" "media_type" NOT NULL,
	"caption" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dancer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"birthday" date NOT NULL,
	"biography" text,
	"awards" text,
	"instagram" text,
	"tiktok" text,
	"youtube" text,
	"location" text,
	"skill_level" text,
	"team_level" text,
	"high_school" text,
	"studio" text,
	"gpa" double precision,
	"grad_year" integer,
	"training_hours" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dancer_interests" (
	"dancer_id" uuid,
	"school_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dancer_interests_pkey" PRIMARY KEY("dancer_id","school_id")
);
--> statement-breakpoint
CREATE TABLE "dancer_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dance_event_attendees" (
	"event_id" uuid,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dance_event_attendees_pkey" PRIMARY KEY("user_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "dance_event_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"schedule" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"school_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"address" text,
	"website" text,
	"tags" text[],
	"cost" numeric,
	"type" "dance_event_type" NOT NULL,
	"start_datetime" timestamp NOT NULL,
	"end_datetime" timestamp NOT NULL,
	"timezone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dancer_feed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"content_id" uuid NOT NULL,
	"content_type" "feed_item_type" NOT NULL,
	"payload" jsonb,
	"dancer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_feed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"content_id" uuid NOT NULL,
	"content_type" "feed_item_type" NOT NULL,
	"payload" jsonb,
	"school_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"youtube_id" text NOT NULL UNIQUE,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"thumbnail" text NOT NULL,
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_events" (
	"event_id" uuid PRIMARY KEY,
	"event_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crv_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"dancer_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"video_id" text NOT NULL,
	"status" "prospect_status" NOT NULL,
	"watched" boolean NOT NULL,
	"watched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"school_id" uuid NOT NULL,
	"dancer_id" uuid NOT NULL,
	"platform_name" "platform_name" NOT NULL,
	"comment" text,
	"rating" smallint,
	"last_contacted" timestamp with time zone,
	"last_notification" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dancer_follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"dancer_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"school_id" uuid NOT NULL,
	"media_id" text NOT NULL UNIQUE,
	"type" "media_type" NOT NULL,
	"caption" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"name" text NOT NULL UNIQUE,
	"location" text NOT NULL,
	"division" text,
	"benefits" text,
	"about" text,
	"website" text,
	"time_commitment" text,
	"head_coach" text,
	"assistant_coach" text,
	"mission_statement" text,
	"what_we_do" text,
	"sports" text[],
	"gpa" double precision,
	"size" integer,
	"tiktok" text,
	"instagram" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dancers_to_skills" (
	"dancer_id" uuid,
	"skill_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dancers_to_skills_pkey" PRIMARY KEY("dancer_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "schools_to_skills" (
	"school_id" uuid,
	"skill_id" text,
	"weight" integer DEFAULT 1,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schools_to_skills_pkey" PRIMARY KEY("school_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "profile_skills" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL UNIQUE,
	"category" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dancers_to_styles" (
	"dancer_id" uuid,
	"style_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dancers_to_styles_pkey" PRIMARY KEY("dancer_id","style_id")
);
--> statement-breakpoint
CREATE TABLE "schools_to_styles" (
	"school_id" uuid,
	"style_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schools_to_styles_pkey" PRIMARY KEY("school_id","style_id")
);
--> statement-breakpoint
CREATE TABLE "profile_styles" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "user_platforms" (
	"user_id" uuid,
	"platform_name" "platform_name",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_platforms_pkey" PRIMARY KEY("user_id","platform_name")
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL UNIQUE,
	"source" "subscription_source" NOT NULL,
	"subscription_id" text NOT NULL UNIQUE,
	"customer_id" text NOT NULL UNIQUE,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"current_period_end" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"platform_name" "platform_name",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"username" citext NOT NULL UNIQUE,
	"email" citext NOT NULL UNIQUE,
	"role" "role" NOT NULL,
	"type" "account_type" NOT NULL,
	"display_email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"password" text NOT NULL,
	"avatar" text,
	"phone" text,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "dancer_achievements_profile_id_index" ON "dancer_achievements" ("profile_id");--> statement-breakpoint
CREATE INDEX "dancer_media_dancer_id_created_at_index" ON "dancer_media" ("dancer_id","created_at");--> statement-breakpoint
CREATE INDEX "dancer_profiles_grad_year_index" ON "dancer_profiles" ("grad_year");--> statement-breakpoint
CREATE INDEX "dancer_profiles_location_index" ON "dancer_profiles" ("location");--> statement-breakpoint
CREATE INDEX "dancer_interests_school_id_index" ON "dancer_interests" ("school_id");--> statement-breakpoint
CREATE INDEX "dancer_references_profile_id_index" ON "dancer_references" ("profile_id");--> statement-breakpoint
CREATE INDEX "dance_event_schedules_event_id_index" ON "dance_event_schedules" ("event_id");--> statement-breakpoint
CREATE INDEX "dance_events_school_id_index" ON "dance_events" ("school_id");--> statement-breakpoint
CREATE INDEX "dance_events_start_datetime_index" ON "dance_events" ("start_datetime");--> statement-breakpoint
CREATE INDEX "dance_events_tags_index" ON "dance_events" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "dancer_feed_dancer_id_created_at_index" ON "dancer_feed" ("dancer_id","created_at");--> statement-breakpoint
CREATE INDEX "school_feed_school_id_created_at_index" ON "school_feed" ("school_id","created_at");--> statement-breakpoint
CREATE INDEX "library_created_at_index" ON "library" ("created_at");--> statement-breakpoint
CREATE INDEX "library_category_index" ON "library" ("category");--> statement-breakpoint
CREATE INDEX "posts_slug_index" ON "posts" ("slug");--> statement-breakpoint
CREATE INDEX "posts_tags_index" ON "posts" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "global_notifications_created_at_index" ON "global_notifications" ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_id_created_at_index" ON "notifications" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "outbox_type_index" ON "outbox" ("type");--> statement-breakpoint
CREATE INDEX "outbox_published_at_index" ON "outbox" ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "crv_submissions_dancer_id_school_id_index" ON "crv_submissions" ("dancer_id","school_id");--> statement-breakpoint
CREATE INDEX "crv_submissions_school_id_index" ON "crv_submissions" ("school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "school_favorites_school_id_dancer_id_index" ON "school_favorites" ("school_id","dancer_id");--> statement-breakpoint
CREATE INDEX "school_favorites_dancer_id_index" ON "school_favorites" ("dancer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dancer_follows_dancer_id_school_id_index" ON "dancer_follows" ("dancer_id","school_id");--> statement-breakpoint
CREATE INDEX "dancer_follows_school_id_index" ON "dancer_follows" ("school_id");--> statement-breakpoint
CREATE INDEX "school_media_school_id_created_at_index" ON "school_media" ("school_id","created_at");--> statement-breakpoint
CREATE INDEX "school_profiles_gpa_index" ON "school_profiles" ("gpa");--> statement-breakpoint
CREATE INDEX "profile_skills_category_index" ON "profile_skills" ("category");--> statement-breakpoint
CREATE INDEX "user_platforms_platform_name_index" ON "user_platforms" ("platform_name");--> statement-breakpoint
CREATE INDEX "user_subscriptions_current_period_end_index" ON "user_subscriptions" ("current_period_end");--> statement-breakpoint
CREATE INDEX "user_activities_user_id_created_at_index" ON "user_activities" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "user_activities_created_at_event_type_index" ON "user_activities" ("created_at","event_type");--> statement-breakpoint
CREATE INDEX "users_created_at_index" ON "users" ("created_at");--> statement-breakpoint
ALTER TABLE "dancer_achievements" ADD CONSTRAINT "dancer_achievements_profile_id_dancer_profiles_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dancer_media" ADD CONSTRAINT "dancer_media_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dancer_profiles" ADD CONSTRAINT "dancer_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dancer_interests" ADD CONSTRAINT "dancer_interests_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dancer_interests" ADD CONSTRAINT "dancer_interests_school_id_school_profiles_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dancer_references" ADD CONSTRAINT "dancer_references_profile_id_dancer_profiles_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dance_event_attendees" ADD CONSTRAINT "dance_event_attendees_event_id_dance_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "dance_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dance_event_attendees" ADD CONSTRAINT "dance_event_attendees_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dance_event_schedules" ADD CONSTRAINT "dance_event_schedules_event_id_dance_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "dance_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dance_events" ADD CONSTRAINT "dance_events_school_id_school_profiles_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dancer_feed" ADD CONSTRAINT "dancer_feed_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "school_feed" ADD CONSTRAINT "school_feed_school_id_school_profiles_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "crv_submissions" ADD CONSTRAINT "crv_submissions_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "crv_submissions" ADD CONSTRAINT "crv_submissions_school_id_school_profiles_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "school_favorites" ADD CONSTRAINT "school_favorites_school_id_school_profiles_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "school_favorites" ADD CONSTRAINT "school_favorites_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dancer_follows" ADD CONSTRAINT "dancer_follows_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dancer_follows" ADD CONSTRAINT "dancer_follows_school_id_school_profiles_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "school_media" ADD CONSTRAINT "school_media_school_id_school_profiles_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "school_profiles" ADD CONSTRAINT "school_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dancers_to_skills" ADD CONSTRAINT "dancers_to_skills_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dancers_to_skills" ADD CONSTRAINT "dancers_to_skills_skill_id_profile_skills_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "profile_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "schools_to_skills" ADD CONSTRAINT "schools_to_skills_school_id_school_profiles_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "schools_to_skills" ADD CONSTRAINT "schools_to_skills_skill_id_profile_skills_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "profile_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "dancers_to_styles" ADD CONSTRAINT "dancers_to_styles_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dancers_to_styles" ADD CONSTRAINT "dancers_to_styles_style_id_profile_styles_id_fkey" FOREIGN KEY ("style_id") REFERENCES "profile_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "schools_to_styles" ADD CONSTRAINT "schools_to_styles_school_id_school_profiles_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "schools_to_styles" ADD CONSTRAINT "schools_to_styles_style_id_profile_styles_id_fkey" FOREIGN KEY ("style_id") REFERENCES "profile_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "user_platforms" ADD CONSTRAINT "user_platforms_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;