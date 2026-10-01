ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD COLUMN "claim_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD COLUMN "claimed_at" timestamp with time zone;