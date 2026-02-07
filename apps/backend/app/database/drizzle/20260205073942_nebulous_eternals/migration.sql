CREATE TABLE "video_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"url" text NOT NULL UNIQUE,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "library";--> statement-breakpoint
CREATE INDEX "video_library_created_at_index" ON "video_library" ("created_at");--> statement-breakpoint
CREATE INDEX "video_library_category_index" ON "video_library" ("category");