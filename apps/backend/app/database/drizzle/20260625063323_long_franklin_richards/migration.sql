ALTER TABLE "users" ADD COLUMN "org_account_tier_expires_at" timestamp with time zone;
-- Backfill: compute expiry from latest event end_date + 3 months for org-tiered users
UPDATE "users" u
SET "org_account_tier_expires_at" = (
  SELECT MAX(e."end_date"::timestamp) + INTERVAL '3 months'
  FROM "event_rosters" r
  JOIN "org_events" e ON e."id" = r."event_id"
  WHERE r."user_id" = u."id" AND r."type" = 'dancer'
)
WHERE u."org_account_tier" IS NOT NULL
  AND u."org_account_tier_expires_at" IS NULL;