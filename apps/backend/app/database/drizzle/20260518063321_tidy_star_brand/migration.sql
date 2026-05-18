ALTER TABLE "event_rosters" ADD COLUMN "checked_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "org_events" ADD COLUMN "start_time" text;--> statement-breakpoint
ALTER TABLE "org_events" ADD COLUMN "timezone" text;