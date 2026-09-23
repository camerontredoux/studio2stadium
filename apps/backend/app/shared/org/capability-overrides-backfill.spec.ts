import { test } from "@japa/runner";
import { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import { orgEvents } from "#database/schema/org-events";
import { resolveCapabilities } from "#shared/org/entitlement";
import {
  EVENT_TIER_CAPABILITIES,
  eventTierIncludes,
  type EventTier,
  type EventTierCapability,
} from "#shared/org/event-tiers";
import { sql } from "drizzle-orm";
import { readFileSync } from "node:fs";

const MIGRATION = "app/database/drizzle/20260923150801_foamy_stephen_strange";

/**
 * Every statement of the migration that moved capability overrides onto the
 * Org Event, read from the migration itself — a backfill test asserting against
 * its own copy of the SQL would prove nothing.
 */
function migrationStatements(): string[] {
  return readFileSync(`${MIGRATION}/migration.sql`, "utf8")
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

/**
 * The rule entitlement followed before #109, restated as the oracle: an
 * explicit boolean on `organizations.features` won, anything else deferred to
 * the event's Event Tier.
 */
function resolvedBeforeTheMove(
  features: Record<string, unknown>,
  eventTier: EventTier
): EventTierCapability[] {
  return EVENT_TIER_CAPABILITIES.filter((capability) => {
    const flag = features[capability];
    return typeof flag === "boolean"
      ? flag
      : eventTierIncludes(eventTier, capability);
  });
}

/** Drizzle signals a deliberate `tx.rollback()` by throwing. */
function isRollback(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.constructor.name === "TransactionRollbackError"
  );
}

interface OrgFixture {
  slug: string;
  features: Record<string, unknown>;
  eventTiers: EventTier[];
}

/**
 * Orgs as they stood before the move: hand-built ones with every key set, one
 * with a mix, one with junk in the JSONB, one with nothing, and one with flags
 * but no event yet.
 */
const FIXTURES: OrgFixture[] = [
  {
    slug: "backfill-prodigy",
    features: {
      check_in: false,
      callbacks: true,
      freeTierUsers: true,
      video_library: true,
      school_selections: true,
    },
    eventTiers: [
      "enterprise",
      "enterprise",
      "enterprise",
      "enterprise",
      "enterprise",
    ],
  },
  {
    slug: "backfill-mixed",
    features: { callbacks: false, video_library: true, qna: true },
    eventTiers: ["core", "regional", "national", "enterprise"],
  },
  {
    slug: "backfill-junk",
    features: { callbacks: "yes", check_in: 1, school_selections: null },
    eventTiers: ["regional", "core"],
  },
  { slug: "backfill-empty", features: {}, eventTiers: ["national"] },
  {
    slug: "backfill-no-events",
    features: { callbacks: false, freeTierUsers: true },
    eventTiers: [],
  },
];

interface MigrationOutcome {
  /** Per event: what it resolved to before and after the migration. */
  events: Array<{
    label: string;
    before: EventTierCapability[];
    after: EventTierCapability[];
  }>;
  /** Each Org's `features` after the migration, by slug. */
  featuresAfter: Map<string, Record<string, unknown>>;
}

/**
 * Winds the schema back to before the migration, writes the fixtures the way
 * they were stored then, and replays the migration. It runs against a schema
 * the rest of the suite does not expect, so the transaction always rolls back.
 */
async function migrate(): Promise<MigrationOutcome> {
  let outcome: MigrationOutcome | undefined;

  try {
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`alter table "org_events" drop column "capability_overrides"`
      );

      const before = new Map<string, EventTierCapability[]>();
      const labels = new Map<string, string>();
      for (const fixture of FIXTURES) {
        const [org] = await tx.execute<{ id: string }>(sql`
          insert into "organizations" ("slug", "name", "features")
          values (${fixture.slug}, ${fixture.slug}, ${JSON.stringify(fixture.features)}::jsonb)
          returning "id"
        `);
        for (const [index, eventTier] of fixture.eventTiers.entries()) {
          const [event] = await tx.execute<{ id: string }>(sql`
            insert into "org_events" ("org_id", "name", "start_date", "end_date", "event_tier")
            values (${org!.id}, ${`${fixture.slug} ${index}`}, '2026-08-01', '2026-08-02', ${eventTier})
            returning "id"
          `);
          before.set(
            event!.id,
            resolvedBeforeTheMove(fixture.features, eventTier)
          );
          labels.set(event!.id, `${fixture.slug} #${index} (${eventTier})`);
        }
      }

      for (const statement of migrationStatements()) {
        await tx.execute(sql.raw(statement));
      }

      const migrated = await tx
        .select({
          id: orgEvents.id,
          eventTier: orgEvents.eventTier,
          capabilityOverrides: orgEvents.capabilityOverrides,
        })
        .from(orgEvents);
      const orgs = await tx
        .select({ slug: organizations.slug, features: organizations.features })
        .from(organizations);

      outcome = {
        events: migrated
          .filter((event) => before.has(event.id))
          .map((event) => ({
            label: labels.get(event.id)!,
            before: before.get(event.id)!,
            after: resolveCapabilities(event),
          })),
        featuresAfter: new Map(
          orgs.map((org) => [org.slug, org.features as Record<string, unknown>])
        ),
      };

      tx.rollback();
    });
  } catch (error) {
    if (!isRollback(error)) throw error;
  }

  if (!outcome) throw new Error("the migration replay produced no outcome");
  return outcome;
}

test.group("Capability overrides move onto the Org Event (#109)", () => {
  test("no event's resolved capabilities change on migration", async ({
    assert,
  }) => {
    const { events } = await migrate();
    const expectedCount = FIXTURES.reduce(
      (sum, fixture) => sum + fixture.eventTiers.length,
      0
    );
    assert.lengthOf(events, expectedCount);

    for (const event of events) {
      assert.sameMembers(event.after, event.before, event.label);
    }
  });

  test("an Org's flags leave the Org once they are on its events, and nothing else does", async ({
    assert,
  }) => {
    const { featuresAfter } = await migrate();

    assert.deepEqual(featuresAfter.get("backfill-prodigy"), {
      freeTierUsers: true,
    });
    assert.deepEqual(featuresAfter.get("backfill-mixed"), { qna: true });
    assert.deepEqual(featuresAfter.get("backfill-empty"), {});
    // No event to carry them to: they stay, and seed the Org's first event.
    assert.deepEqual(featuresAfter.get("backfill-no-events"), {
      callbacks: false,
      freeTierUsers: true,
    });
  });
});
