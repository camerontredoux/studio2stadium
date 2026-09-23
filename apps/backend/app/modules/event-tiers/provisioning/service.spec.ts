import { db } from "#database/connection";
import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import {
  csvUploads,
  eventAuditLog,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { orgMemberships, organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { E_NOT_FOUND } from "#exceptions/not-found";
import { test } from "@japa/runner";
import { eq } from "drizzle-orm";
import { type CheckoutMetadata } from "../checkout/metadata.ts";
import { ProvisionPurchaseService } from "./service.ts";
import { deriveOrgSlug, orgSlugCandidates } from "./slug.ts";

const svc = new ProvisionPurchaseService(new DatabaseService());

async function makeBuyer(suffix: string) {
  const [buyer] = await db
    .insert(users)
    .values({
      username: `organizer_${suffix}`,
      email: `organizer_${suffix}@example.com`,
      displayEmail: `organizer_${suffix}@example.com`,
      firstName: "Ada",
      lastName: "Organizer",
      password: "h",
      role: "user",
      type: "dancer",
    })
    .returning();

  return buyer!;
}

const purchase = (
  overrides: Partial<CheckoutMetadata> = {}
): CheckoutMetadata => ({
  eventTier: "regional",
  orgName: "The Summit",
  eventName: "Summit 2026",
  startDate: "2026-06-13",
  endDate: "2026-06-14",
  ...overrides,
});

async function wipe() {
  await db.delete(eventAuditLog).execute();
  await db.delete(csvUploads).execute();
  await db.delete(eventRosters).execute();
  await db.delete(eventTierPurchases).execute();
  await db.delete(orgEvents).execute();
  await db.delete(orgMemberships).execute();
  await db.delete(users).execute();
  await db.delete(organizations).execute();
}

test.group("ProvisionPurchaseService", (group) => {
  group.each.setup(async () => {
    await wipe();
  });

  // `event_tier_purchases.buyer_id` is ON DELETE RESTRICT, so rows left behind
  // here would break the blanket `delete(users)` other suites run.
  group.each.teardown(async () => {
    await db.delete(eventTierPurchases).execute();
  });

  test("a first purchase creates the Org, its Org Event at the bought Event Tier, and an organizer admin membership", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("first");

    const result = await svc.execute({
      reference: "cs_first",
      buyerUserId: buyer.id,
      purchase: purchase({ eventTier: "national" }),
    });

    assert.isTrue(result.provisioned);
    assert.equal(result.org.name, "The Summit");
    assert.equal(result.org.slug, "the-summit");
    assert.equal(result.event.name, "Summit 2026");
    assert.equal(result.event.orgId, result.org.id);
    assert.equal(result.event.eventTier, "national");
    assert.equal(result.event.startDate, "2026-06-13");
    assert.equal(result.event.endDate, "2026-06-14");

    const memberships = await db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.orgId, result.org.id));

    assert.lengthOf(memberships, 1);
    assert.equal(memberships[0]!.userId, buyer.id);
    assert.equal(memberships[0]!.type, "organizer");
    assert.equal(memberships[0]!.role, "admin");
  });

  test("the Org Event is created inactive, for the Organizer to configure and activate", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("active");

    const first = await svc.execute({
      reference: "cs_active_1",
      buyerUserId: buyer.id,
      purchase: purchase(),
    });

    // What arrives from checkout is a name and two dates. The active event is
    // what `OrgEventMiddleware` routes every request in the Org's area into, so
    // a purchase must not put an unconfigured event there — the Organizer sets
    // the event up and activates it through `orgs/events/update`, which is also
    // what stands the previous active event down.
    assert.isFalse(first.event.isActive);

    const second = await svc.execute({
      reference: "cs_active_2",
      buyerUserId: buyer.id,
      purchase: purchase({ eventName: "Summit 2027" }),
    });
    assert.isFalse(second.event.isActive);

    const active = await db
      .select({ id: orgEvents.id })
      .from(orgEvents)
      .where(eq(orgEvents.isActive, true));

    assert.lengthOf(active, 0);
  });

  test("a second purchase by the same buyer adds an Org Event to their existing Org", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("second");

    const first = await svc.execute({
      reference: "cs_second_1",
      buyerUserId: buyer.id,
      purchase: purchase(),
    });

    const second = await svc.execute({
      reference: "cs_second_2",
      buyerUserId: buyer.id,
      // A different Org name on the second purchase does not fork the tenant:
      // S2S Live is sold per event, not per Org (ADR 0001).
      purchase: purchase({ orgName: "Summit Dance", eventName: "Combine" }),
    });

    assert.equal(second.org.id, first.org.id);
    assert.notEqual(second.event.id, first.event.id);

    const orgs = await db.select().from(organizations);
    assert.lengthOf(orgs, 1);

    const events = await db
      .select()
      .from(orgEvents)
      .where(eq(orgEvents.orgId, first.org.id));
    assert.lengthOf(events, 2);

    const memberships = await db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, buyer.id));
    assert.lengthOf(memberships, 1);
  });

  test("an Org name whose derived URL is already taken still produces a usable Org", async ({
    assert,
  }) => {
    await db
      .insert(organizations)
      .values({ name: "The Summit", slug: "the-summit" })
      .execute();

    const buyer = await makeBuyer("collision");

    const result = await svc.execute({
      reference: "cs_collision",
      buyerUserId: buyer.id,
      purchase: purchase(),
    });

    assert.equal(result.org.name, "The Summit");
    assert.equal(result.org.slug, "the-summit-2");
    assert.equal(result.event.orgId, result.org.id);
  });

  test("provisioning the same purchase twice provisions once", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("redelivery");
    const input = {
      reference: "cs_redelivered",
      buyerUserId: buyer.id,
      purchase: purchase(),
    };

    const first = await svc.execute(input);
    const second = await svc.execute(input);

    assert.isTrue(first.provisioned);
    assert.isFalse(second.provisioned);
    assert.equal(second.org.id, first.org.id);
    assert.equal(second.event.id, first.event.id);
    assert.equal(second.purchase.id, first.purchase.id);

    assert.lengthOf(await db.select().from(organizations), 1);
    assert.lengthOf(await db.select().from(orgEvents), 1);
    assert.lengthOf(await db.select().from(eventTierPurchases), 1);
    assert.lengthOf(await db.select().from(orgMemberships), 1);
  });

  test("a failure part-way leaves nothing behind", async ({ assert }) => {
    const buyer = await makeBuyer("atomic");

    let caught: unknown;
    try {
      await svc.execute({
        reference: "cs_atomic",
        buyerUserId: buyer.id,
        // Longer than `org_events.name`, so the Org is already inserted by the
        // time the event insert fails.
        purchase: purchase({ eventName: "E".repeat(200) }),
      });
    } catch (error) {
      caught = error;
    }

    assert.exists(caught, "expected provisioning to fail");
    assert.lengthOf(await db.select().from(organizations), 0);
    assert.lengthOf(await db.select().from(orgEvents), 0);
    assert.lengthOf(await db.select().from(orgMemberships), 0);
    assert.lengthOf(await db.select().from(eventTierPurchases), 0);
  });

  test("a buyer id with no account provisions nothing", async ({ assert }) => {
    let caught: unknown;
    try {
      await svc.execute({
        reference: "cs_no_buyer",
        buyerUserId: "8f14e45f-ceea-4c9e-b0f5-8a3f3a1e2a2b",
        purchase: purchase(),
      });
    } catch (error) {
      caught = error;
    }

    assert.instanceOf(caught, E_NOT_FOUND);
    assert.lengthOf(await db.select().from(organizations), 0);
    assert.lengthOf(await db.select().from(eventTierPurchases), 0);
  });

  test("the buyer is matched on user id, never on the email they share with another account", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("identity");
    const [impostor] = await db
      .insert(users)
      .values({
        username: "finance_dept",
        // The address a corporate card would bill to (ADR 0004).
        email: `organizer_identity@example.com.billing`,
        displayEmail: "organizer_identity@example.com",
        firstName: "Finance",
        lastName: "Department",
        password: "h",
        role: "user",
        type: "dancer",
      })
      .returning();

    const result = await svc.execute({
      reference: "cs_identity",
      buyerUserId: buyer.id,
      purchase: purchase(),
    });

    assert.equal(result.purchase.buyerId, buyer.id);

    const memberships = await db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, impostor!.id));
    assert.lengthOf(memberships, 0);
  });

  test("the organizer never becomes a Roster Entry", async ({ assert }) => {
    const buyer = await makeBuyer("roster");

    const result = await svc.execute({
      reference: "cs_roster",
      buyerUserId: buyer.id,
      purchase: purchase(),
    });

    // ADR 0003: an Organizer runs the event and never appears on a roster. The
    // staff-flagged row `CreateEventService` seeds for a product admin (issues
    // #99/#101) is a coach preview sandbox — a purchase must not produce even
    // that, staff flag or not.
    const roster = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.eventId, result.event.id));

    assert.lengthOf(roster, 0);

    const coachMemberships = await db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.type, "coach"));

    assert.lengthOf(coachMemberships, 0);
  });

  test("what was bought, by whom, and at what Event Tier is retrievable", async ({
    assert,
  }) => {
    const buyer = await makeBuyer("record");

    const result = await svc.execute({
      reference: "cs_record",
      buyerUserId: buyer.id,
      purchase: purchase({ eventTier: "core" }),
    });

    const found = await svc.find("cs_record");

    assert.exists(found);
    assert.equal(found!.id, result.purchase.id);
    assert.equal(found!.buyerId, buyer.id);
    assert.equal(found!.eventId, result.event.id);
    assert.equal(found!.eventTier, "core");

    assert.isNull(await svc.find("cs_never_happened"));
  });
});

test.group("deriveOrgSlug", () => {
  test("derives a URL from the name the Organizer typed", ({ assert }) => {
    assert.equal(deriveOrgSlug("The Summit"), "the-summit");
    assert.equal(deriveOrgSlug("  Élan Dance & Co.  "), "elan-dance-co");
    assert.equal(deriveOrgSlug("Summit -- 2026"), "summit-2026");
  });

  test("a name with nothing URL-safe in it still produces a slug", ({
    assert,
  }) => {
    assert.equal(deriveOrgSlug("!!!"), "org");
    assert.equal(deriveOrgSlug("東京"), "org");
  });

  test("candidates stay within the slug column", ({ assert }) => {
    const candidates = orgSlugCandidates("a".repeat(120));

    for (const candidate of candidates) {
      assert.isAtMost(candidate.length, 64);
      assert.match(candidate, /^[a-z0-9-]+$/);
    }

    assert.equal(new Set(candidates).size, candidates.length);
  });
});
