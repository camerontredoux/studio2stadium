-- Backfill org_account_tier from existing data before dropping limited
UPDATE "users" SET "org_account_tier" = 'limited' WHERE "limited" = true;
UPDATE "users" SET "org_account_tier" = 'standard'
  WHERE "org_account_tier" IS NULL
    AND "id" IN (
      SELECT DISTINCT "user_id" FROM "premium_grants"
      WHERE "source_type" = 'org_event'
    );
ALTER TABLE "users" DROP COLUMN "limited";