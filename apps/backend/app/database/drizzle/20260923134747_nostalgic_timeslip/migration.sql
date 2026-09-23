ALTER TABLE "organizations" ADD COLUMN "self_serve" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Every Org that already holds an Event Tier purchase is self-serve. Orgs with
-- none predate billing and stay grandfathered (ADR 0006).
UPDATE "organizations" SET "self_serve" = true
WHERE "id" IN (
	SELECT "org_events"."org_id"
	FROM "event_tier_purchases"
	INNER JOIN "org_events" ON "org_events"."id" = "event_tier_purchases"."event_id"
);
