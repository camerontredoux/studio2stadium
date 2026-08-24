import { test } from "@japa/runner";
import { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import { seedOrganizations } from "#commands/backfill-organizations";
import {
  EVENT_TIER_CAPABILITIES,
  eventTierIncludes,
  type EventTier,
  type EventTierCapability,
} from "#shared/org/event-tiers";
import { eq, sql } from "drizzle-orm";
import { readFileSync } from "node:fs";

const MIGRATION = "app/database/drizzle/20260824163832_modern_smasher";

/**
 * The `ALTER TABLE org_events` statement from the migration that introduced the
 * Event Tier column, read from the migration itself rather than restated here —
 * a backfill test that asserts against its own copy of the SQL proves nothing.
 * The `CREATE TYPE` statement in the same file is skipped: the type already
 * exists, and it is the column default that does the grandfathering.
 */
function addEventTierColumnSql(): string {
  const statements = readFileSync(`${MIGRATION}/migration.sql`, "utf8").split(
    "--> statement-breakpoint"
  );
  const alter = statements.find((s) => s.includes('ALTER TABLE "org_events"'));
  if (!alter) throw new Error(`No org_events ALTER found in ${MIGRATION}`);
  return alter.trim().replace(/;$/, "");
}

/** Drizzle signals a deliberate `tx.rollback()` by throwing. */
function isRollback(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.constructor.name === "TransactionRollbackError"
  );
}

/**
 * The Event Tier an Org Event ends up with when it was written *before* the
 * column existed.
 *
 * Winds the schema back to before the migration, writes the row the way every
 * pre-billing event was written, then replays the migration — so what is
 * asserted is the migration's effect on an existing row, not the column
 * default's effect on a new one. All of it runs against a schema the rest of
 * the suite does not expect, so the transaction is always rolled back.
 */
async function eventTierAfterMigrating(orgId: string): Promise<EventTier> {
  let migrated: EventTier | undefined;

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`alter table "org_events" drop column "event_tier"`);

      const [before] = await tx.execute<{ id: string }>(sql`
        insert into "org_events" ("org_id", "name", "start_date", "end_date")
        values (${orgId}, 'Grandfathered Event', '2026-08-01', '2026-08-02')
        returning "id"
      `);

      await tx.execute(sql.raw(addEventTierColumnSql()));

      const [after] = await tx.execute<{ event_tier: EventTier }>(sql`
        select "event_tier" from "org_events" where "id" = ${before!.id}
      `);
      migrated = after!.event_tier;

      tx.rollback();
    });
  } catch (error) {
    if (!isRollback(error)) throw error;
  }

  if (!migrated) throw new Error("the migration replay produced no row");
  return migrated;
}

test.group("org_events Event Tier backfill", (group) => {
  group.each.setup(async () => {
    await db.delete(organizations).execute();
    await seedOrganizations();
  });

  async function summit() {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    return org!;
  }

  test("an Org Event that existed before the migration reads Enterprise", async ({
    assert,
  }) => {
    const org = await summit();
    assert.equal(await eventTierAfterMigrating(org.id), "enterprise");
  });

  test("a grandfathered event keeps the access its org's feature flags gave it", async ({
    assert,
  }) => {
    const org = await summit();
    const eventTier = await eventTierAfterMigrating(org.id);

    // Every capability the org's `features` JSONB switches on today must still
    // be included once entitlement resolves from the event's Event Tier.
    const features = org.features as Record<string, unknown>;
    const granted = EVENT_TIER_CAPABILITIES.filter((key) =>
      Boolean(features[key])
    );
    assert.isNotEmpty(granted, "the summit org should grant some capabilities");

    for (const capability of granted as EventTierCapability[]) {
      assert.isTrue(
        eventTierIncludes(eventTier, capability),
        `grandfathered event lost ${capability}`
      );
    }
  });
});
