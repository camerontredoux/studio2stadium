ALTER TABLE "users" ADD COLUMN "notifications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "dancer_profiles" ALTER COLUMN "location" SET NOT NULL;