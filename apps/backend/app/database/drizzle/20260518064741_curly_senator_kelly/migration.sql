CREATE TABLE "event_showcases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "published_callbacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"showcase_id" uuid NOT NULL,
	"coach_roster_id" uuid NOT NULL,
	"dancer_roster_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "event_callbacks_event_id_coach_roster_id_dancer_roster_id_index";--> statement-breakpoint
ALTER TABLE "event_callbacks" ADD COLUMN "showcase_id" uuid;
--> statement-breakpoint
INSERT INTO "event_showcases" ("event_id", "number", "status")
SELECT DISTINCT "event_id", 1, 'active'
FROM "event_callbacks"
ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "event_callbacks" SET "showcase_id" = (
  SELECT "id" FROM "event_showcases"
  WHERE "event_showcases"."event_id" = "event_callbacks"."event_id"
  LIMIT 1
);
--> statement-breakpoint
ALTER TABLE "event_callbacks" ALTER COLUMN "showcase_id" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "event_callbacks_showcase_id_coach_roster_id_dancer_roster_id_index" ON "event_callbacks" ("showcase_id","coach_roster_id","dancer_roster_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_showcases_one_active_per_event" ON "event_showcases" ("event_id") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "event_showcases_event_id_index" ON "event_showcases" ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "published_callbacks_showcase_id_coach_roster_id_dancer_roster_id_index" ON "published_callbacks" ("showcase_id","coach_roster_id","dancer_roster_id");--> statement-breakpoint
CREATE INDEX "published_callbacks_showcase_id_dancer_roster_id_index" ON "published_callbacks" ("showcase_id","dancer_roster_id");--> statement-breakpoint
ALTER TABLE "event_callbacks" ADD CONSTRAINT "event_callbacks_showcase_id_event_showcases_id_fkey" FOREIGN KEY ("showcase_id") REFERENCES "event_showcases"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_showcases" ADD CONSTRAINT "event_showcases_event_id_org_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "org_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "published_callbacks" ADD CONSTRAINT "published_callbacks_showcase_id_event_showcases_id_fkey" FOREIGN KEY ("showcase_id") REFERENCES "event_showcases"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "published_callbacks" ADD CONSTRAINT "published_callbacks_coach_roster_id_event_rosters_id_fkey" FOREIGN KEY ("coach_roster_id") REFERENCES "event_rosters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "published_callbacks" ADD CONSTRAINT "published_callbacks_dancer_roster_id_event_rosters_id_fkey" FOREIGN KEY ("dancer_roster_id") REFERENCES "event_rosters"("id") ON DELETE CASCADE;