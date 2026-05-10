CREATE TABLE "event_checklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"completed" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "event_checklist_event_id_index" ON "event_checklist" ("event_id");--> statement-breakpoint
ALTER TABLE "event_checklist" ADD CONSTRAINT "event_checklist_event_id_org_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "org_events"("id") ON DELETE CASCADE;