ALTER TABLE "notifications" ADD COLUMN "seen_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "notifications_created_at_index" ON "notifications" ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_seen_at_index" ON "notifications" ("seen_at") WHERE ("seen_at" is null);