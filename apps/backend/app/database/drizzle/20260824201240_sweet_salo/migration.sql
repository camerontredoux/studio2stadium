-- The `event_tier` enum and `org_events.event_tier` already exist: they shipped
-- in 20260824163832_modern_smasher. The generator re-proposed them because
-- 20260824170307_sour_goliath was generated from a branch that did not have that
-- migration yet, so the snapshot it left behind is missing both. This migration's
-- snapshot has them, which puts the chain back on its feet; only the statements
-- below are new.
CREATE TABLE "event_tier_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"reference" text NOT NULL UNIQUE,
	"buyer_id" uuid NOT NULL,
	"event_id" uuid NOT NULL UNIQUE,
	"event_tier" "event_tier" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "event_tier_purchases_buyer_id_index" ON "event_tier_purchases" ("buyer_id");--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD CONSTRAINT "event_tier_purchases_buyer_id_users_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD CONSTRAINT "event_tier_purchases_event_id_org_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "org_events"("id") ON DELETE CASCADE;
