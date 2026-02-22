CREATE TABLE "crv_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"dancer_id" uuid NOT NULL UNIQUE,
	"youtube_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "crv_videos_dancer_id_index" ON "crv_videos" ("dancer_id");--> statement-breakpoint
CREATE INDEX "crv_videos_youtube_id_index" ON "crv_videos" ("youtube_id");--> statement-breakpoint
ALTER TABLE "crv_videos" ADD CONSTRAINT "crv_videos_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;