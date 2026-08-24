ALTER TYPE "org_member_type" ADD VALUE 'organizer';--> statement-breakpoint
DROP INDEX "org_memberships_user_id_org_id_index";--> statement-breakpoint
CREATE UNIQUE INDEX "org_memberships_user_id_org_id_index" ON "org_memberships" ("user_id","org_id") WHERE type in ('coach', 'dancer');--> statement-breakpoint
CREATE UNIQUE INDEX "org_memberships_one_organizer_per_org" ON "org_memberships" ("user_id","org_id") WHERE type not in ('coach', 'dancer');--> statement-breakpoint
ALTER TABLE "csv_uploads" ADD CONSTRAINT "csv_uploads_participant_type" CHECK (type in ('coach', 'dancer'));--> statement-breakpoint
ALTER TABLE "event_rosters" ADD CONSTRAINT "event_rosters_participant_type" CHECK (type in ('coach', 'dancer'));