DROP INDEX "outbox_published_at_index";--> statement-breakpoint
CREATE INDEX "outbox_published_at_index" ON "outbox" ("published_at") WHERE ("published_at" is null);