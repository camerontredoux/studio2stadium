ALTER TABLE "users" ADD COLUMN "limited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event_rosters" ADD COLUMN "paid" boolean DEFAULT false;