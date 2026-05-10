ALTER TYPE "audit_resource" ADD VALUE 'video_category';--> statement-breakpoint
ALTER TYPE "audit_resource" ADD VALUE 'video';--> statement-breakpoint
CREATE TABLE "event_video_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"title" varchar(300) NOT NULL,
	"youtube_id" varchar(20) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "event_video_categories_event_id_index" ON "event_video_categories" ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_video_categories_event_id_name_index" ON "event_video_categories" ("event_id","name");--> statement-breakpoint
CREATE INDEX "event_videos_event_id_index" ON "event_videos" ("event_id");--> statement-breakpoint
CREATE INDEX "event_videos_category_id_index" ON "event_videos" ("category_id");--> statement-breakpoint
ALTER TABLE "event_video_categories" ADD CONSTRAINT "event_video_categories_event_id_org_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "org_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_videos" ADD CONSTRAINT "event_videos_event_id_org_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "org_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_videos" ADD CONSTRAINT "event_videos_category_id_event_video_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_video_categories"("id") ON DELETE RESTRICT;