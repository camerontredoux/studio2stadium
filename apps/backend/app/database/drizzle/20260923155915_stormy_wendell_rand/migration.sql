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
