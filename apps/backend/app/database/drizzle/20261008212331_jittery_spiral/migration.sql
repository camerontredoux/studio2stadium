ALTER TABLE "tracker_items" ADD COLUMN "event_id" uuid;--> statement-breakpoint
CREATE INDEX "tracker_items_event_id_index" ON "tracker_items" ("event_id");--> statement-breakpoint
ALTER TABLE "tracker_items" ADD CONSTRAINT "tracker_items_event_id_dance_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "dance_events"("id") ON DELETE SET NULL;