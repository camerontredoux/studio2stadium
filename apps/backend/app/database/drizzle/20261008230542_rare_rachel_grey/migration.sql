CREATE TABLE "tracker_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"dancer_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"title" text NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tracker_milestones_dancer_id_school_id_index" ON "tracker_milestones" ("dancer_id","school_id");--> statement-breakpoint
ALTER TABLE "tracker_milestones" ADD CONSTRAINT "tracker_milestones_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tracker_milestones" ADD CONSTRAINT "tracker_milestones_school_id_school_profiles_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
-- Backfill: school stages used to be fixed milestones. Give each tracked
-- school one completed milestone per stage it reached (stage n reached
-- "Reached out" through STAGES.school[n]), so dancers keep their progress.
-- created_at is offset by n milliseconds to keep the stages in order.
INSERT INTO "tracker_milestones" ("dancer_id", "school_id", "title", "completed_at", "created_at", "updated_at")
SELECT
	i."dancer_id",
	i."school_id",
	(ARRAY['Reached out', 'Visited', 'Auditioned', 'Offer', 'Committed'])[n],
	i."updated_at",
	i."created_at" + n * interval '1 millisecond',
	now()
FROM "tracker_items" i
CROSS JOIN LATERAL generate_series(1, least(i."stage", 5)) AS n
WHERE i."type" = 'school' AND i."school_id" IS NOT NULL AND i."stage" >= 1;
