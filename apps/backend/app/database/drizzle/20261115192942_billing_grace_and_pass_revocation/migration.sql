ALTER TABLE "user_subscriptions" ADD COLUMN "past_due_since" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "week_passes" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
-- Subscriptions already past_due start their grace from their last update.
UPDATE "user_subscriptions" SET "past_due_since" = "updated_at" WHERE "status" = 'past_due';
