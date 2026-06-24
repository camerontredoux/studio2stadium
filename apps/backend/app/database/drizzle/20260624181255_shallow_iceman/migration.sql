ALTER TABLE "event_rosters" ADD COLUMN "is_staff" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DROP INDEX "event_rosters_event_id_email_index";--> statement-breakpoint
CREATE UNIQUE INDEX "event_rosters_event_id_email_index" ON "event_rosters" ("event_id","email") WHERE is_staff = false;--> statement-breakpoint
CREATE UNIQUE INDEX "event_rosters_staff_per_user" ON "event_rosters" ("event_id","user_id","type") WHERE is_staff = true;
