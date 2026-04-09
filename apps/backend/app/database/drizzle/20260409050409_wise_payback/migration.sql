CREATE TABLE "event_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"coach_roster_id" uuid NOT NULL,
	"dancer_roster_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"coach_roster_id" uuid NOT NULL,
	"dancer_roster_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"coach_roster_id" uuid NOT NULL,
	"dancer_roster_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "event_favorites_event_id_coach_roster_id_dancer_roster_id_index" ON "event_favorites" ("event_id","coach_roster_id","dancer_roster_id");--> statement-breakpoint
CREATE INDEX "event_favorites_coach_roster_id_index" ON "event_favorites" ("coach_roster_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_notes_event_id_coach_roster_id_dancer_roster_id_index" ON "event_notes" ("event_id","coach_roster_id","dancer_roster_id");--> statement-breakpoint
CREATE INDEX "event_notes_coach_roster_id_index" ON "event_notes" ("coach_roster_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_ratings_event_id_coach_roster_id_dancer_roster_id_index" ON "event_ratings" ("event_id","coach_roster_id","dancer_roster_id");--> statement-breakpoint
CREATE INDEX "event_ratings_coach_roster_id_index" ON "event_ratings" ("coach_roster_id");--> statement-breakpoint
ALTER TABLE "event_favorites" ADD CONSTRAINT "event_favorites_event_id_org_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "org_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_favorites" ADD CONSTRAINT "event_favorites_coach_roster_id_event_rosters_id_fkey" FOREIGN KEY ("coach_roster_id") REFERENCES "event_rosters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_favorites" ADD CONSTRAINT "event_favorites_dancer_roster_id_event_rosters_id_fkey" FOREIGN KEY ("dancer_roster_id") REFERENCES "event_rosters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_notes" ADD CONSTRAINT "event_notes_event_id_org_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "org_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_notes" ADD CONSTRAINT "event_notes_coach_roster_id_event_rosters_id_fkey" FOREIGN KEY ("coach_roster_id") REFERENCES "event_rosters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_notes" ADD CONSTRAINT "event_notes_dancer_roster_id_event_rosters_id_fkey" FOREIGN KEY ("dancer_roster_id") REFERENCES "event_rosters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_ratings" ADD CONSTRAINT "event_ratings_event_id_org_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "org_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_ratings" ADD CONSTRAINT "event_ratings_coach_roster_id_event_rosters_id_fkey" FOREIGN KEY ("coach_roster_id") REFERENCES "event_rosters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_ratings" ADD CONSTRAINT "event_ratings_dancer_roster_id_event_rosters_id_fkey" FOREIGN KEY ("dancer_roster_id") REFERENCES "event_rosters"("id") ON DELETE CASCADE;