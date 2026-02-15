CREATE TABLE "profile_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"media_url" text NOT NULL UNIQUE,
	"caption" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"media_id" text NOT NULL UNIQUE,
	"caption" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "dancer_media";--> statement-breakpoint
DROP TABLE "school_media";--> statement-breakpoint
CREATE INDEX "profile_images_user_id_created_at_index" ON "profile_images" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "profile_videos_user_id_created_at_index" ON "profile_videos" ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "profile_images" ADD CONSTRAINT "profile_images_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "profile_videos" ADD CONSTRAINT "profile_videos_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;