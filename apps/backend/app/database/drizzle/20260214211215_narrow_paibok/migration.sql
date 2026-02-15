CREATE TABLE "feed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"content_id" uuid NOT NULL,
	"content_type" "feed_item_type" NOT NULL,
	"payload" jsonb,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "dancer_feed";--> statement-breakpoint
DROP TABLE "school_feed";--> statement-breakpoint
ALTER TABLE "feed" ADD CONSTRAINT "feed_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;