CREATE TABLE "event_school_selections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"dancer_roster_id" uuid NOT NULL,
	"coach_roster_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "event_school_selections_event_id_dancer_roster_id_coach_roster_id_index" ON "event_school_selections" ("event_id","dancer_roster_id","coach_roster_id");--> statement-breakpoint
CREATE INDEX "event_school_selections_event_id_dancer_roster_id_index" ON "event_school_selections" ("event_id","dancer_roster_id");--> statement-breakpoint
CREATE INDEX "event_school_selections_event_id_coach_roster_id_index" ON "event_school_selections" ("event_id","coach_roster_id");--> statement-breakpoint
ALTER TABLE "event_school_selections" ADD CONSTRAINT "event_school_selections_event_id_org_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "org_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_school_selections" ADD CONSTRAINT "event_school_selections_dancer_roster_id_event_rosters_id_fkey" FOREIGN KEY ("dancer_roster_id") REFERENCES "event_rosters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_school_selections" ADD CONSTRAINT "event_school_selections_coach_roster_id_event_rosters_id_fkey" FOREIGN KEY ("coach_roster_id") REFERENCES "event_rosters"("id") ON DELETE CASCADE;