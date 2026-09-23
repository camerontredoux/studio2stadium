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
