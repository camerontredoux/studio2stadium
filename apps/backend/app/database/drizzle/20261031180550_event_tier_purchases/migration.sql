-- Self-serve Event Tier purchases (PRD #84). These statements were written as
-- ten migrations on the feature branch, dated before main's October
-- migrations. The migrator applies only migrations newer than the last one a
-- database has run, so they are folded into this one, in their original order.
-- The `event_tier` enum and `org_events.event_tier` already exist: they
-- shipped in 20260824163832_modern_smasher.
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
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "self_serve" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Every Org that already holds an Event Tier purchase is self-serve. Orgs with
-- none predate billing and stay grandfathered (ADR 0006).
UPDATE "organizations" SET "self_serve" = true
WHERE "id" IN (
	SELECT "org_events"."org_id"
	FROM "event_tier_purchases"
	INNER JOIN "org_events" ON "org_events"."id" = "event_tier_purchases"."event_id"
);
--> statement-breakpoint
CREATE TYPE "purchase_deactivation_reason" AS ENUM('refunded', 'disputed');--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD COLUMN "payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD COLUMN "deactivated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD COLUMN "deactivation_reason" "purchase_deactivation_reason";--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD COLUMN "deactivation_reference" text;--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD CONSTRAINT "event_tier_purchases_payment_intent_id_key" UNIQUE("payment_intent_id");
--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD COLUMN "amount_total" integer;--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD COLUMN "currency" text;
--> statement-breakpoint
ALTER TABLE "org_events" ADD COLUMN "capability_overrides" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
-- #109: capability overrides move from the Org onto each Org Event. Every event
-- takes a copy of its Org's explicit capability flags, so no event resolves
-- differently once entitlement stops reading `organizations.features`. Only
-- boolean values were ever read as overrides; anything else deferred to the
-- Event Tier and still does.
UPDATE "org_events" AS "e"
SET "capability_overrides" = COALESCE((
  SELECT jsonb_object_agg("f"."key", "f"."value")
  FROM "organizations" AS "o", jsonb_each(
    CASE WHEN jsonb_typeof("o"."features") = 'object' THEN "o"."features" ELSE '{}'::jsonb END
  ) AS "f"
  WHERE "o"."id" = "e"."org_id"
    AND "f"."key" IN ('callbacks', 'check_in', 'school_selections', 'video_library')
    AND jsonb_typeof("f"."value") = 'boolean'
), '{}'::jsonb);--> statement-breakpoint
-- The Org's copies are no longer read once they are on its events. Leaving
-- them would invite someone to edit a flag that does nothing. An Org with no
-- event keeps its flags: they are what its first hand-built event starts from
-- (see `CreateEventService`), exactly as they would have applied to it before.
UPDATE "organizations"
SET "features" = "features" - 'callbacks' - 'check_in' - 'school_selections' - 'video_library'
WHERE jsonb_typeof("features") = 'object'
  AND EXISTS (SELECT 1 FROM "org_events" WHERE "org_events"."org_id" = "organizations"."id");
--> statement-breakpoint
ALTER TABLE "event_tier_purchases" DROP CONSTRAINT "event_tier_purchases_event_id_org_events_id_fkey", ADD CONSTRAINT "event_tier_purchases_event_id_org_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "org_events"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "tier_managed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Every Org where staff already put an event below Enterprise is tier-managed.
-- Bought events are left out: a purchase makes its Org self-serve instead.
-- Orgs whose events are all Enterprise stay grandfathered (ADR 0006).
UPDATE "organizations" SET "tier_managed" = true
WHERE "id" IN (
	SELECT "org_events"."org_id"
	FROM "org_events"
	LEFT JOIN "event_tier_purchases" ON "event_tier_purchases"."event_id" = "org_events"."id"
	WHERE "org_events"."event_tier" <> 'enterprise'
	AND "event_tier_purchases"."id" IS NULL
);
--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD COLUMN "buyer_account_created" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD COLUMN "claim_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD COLUMN "claimed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TYPE "account_type" ADD VALUE 'organizer';
