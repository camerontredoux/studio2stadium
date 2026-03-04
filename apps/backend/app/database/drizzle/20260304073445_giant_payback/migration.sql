CREATE TYPE "video_type" AS ENUM('youtube', 'cloudflare');--> statement-breakpoint
CREATE TYPE "video_upload_status" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "video_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"cloudflare_media_id" text NOT NULL UNIQUE,
	"status" "video_upload_status" DEFAULT 'pending'::"video_upload_status" NOT NULL,
	"thumbnail_url" text,
	"duration" real,
	"error_message" text,
	"video_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_videos" ADD COLUMN "type" "video_type" DEFAULT 'youtube'::"video_type" NOT NULL;--> statement-breakpoint
CREATE INDEX "video_uploads_user_id_index" ON "video_uploads" ("user_id");--> statement-breakpoint
CREATE INDEX "video_uploads_cloudflare_media_id_index" ON "video_uploads" ("cloudflare_media_id");--> statement-breakpoint
ALTER TABLE "video_uploads" ADD CONSTRAINT "video_uploads_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "video_uploads" ADD CONSTRAINT "video_uploads_video_id_profile_videos_id_fkey" FOREIGN KEY ("video_id") REFERENCES "profile_videos"("id") ON DELETE SET NULL;