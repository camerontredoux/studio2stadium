import { db } from "#database/connection";
import {
  eventCallbacks,
  eventNotes,
  eventRatings,
  eventShowcases,
  publishedCallbacks,
} from "#database/schema/event-features";
import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import {
  csvUploads,
  eventAuditLog,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import {
  orgMemberships,
  organizations,
  premiumGrants,
} from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import OrgEventMiddleware from "#middleware/routes/org-event";
import { ListEventsService } from "#modules/orgs/events/list/service";
import {
  DeactivatedPurchaseActivateError,
  UpdateEventService,
} from "#modules/orgs/events/update/service";
import { GetOrgService } from "#modules/orgs/get-org/service";
import type { HttpContext } from "@adonisjs/core/http";
import mail from "@adonisjs/mail/services/main";
import { test } from "@japa/runner";
import { eq } from "drizzle-orm";
import { ProvisionPurchaseService } from "../provisioning/service.ts";
import PurchaseDeactivatedEmail from "./email.ts";
import { DeactivatePurchaseService } from "./service.ts";

const dbService = new DatabaseService();
const svc = new DeactivatePurchaseService(dbService);
const provision = new ProvisionPurchaseService(dbService);
const update = new UpdateEventService(dbService);

async function makeUser(suffix: string, role: "admin" | "user" = "user") {
  const [user] = await db
    .insert(users)
    .values({
      username: `refund_${suffix}`,
      email: `refund_${suffix}@example.com`,
      displayEmail: `refund_${suffix}@example.com`,
      firstName: "Ada",
      lastName: suffix,
      password: "h",
      role,
      type: "dancer",
      // Proved they read the inbox: a purchase attaches straight away.
      emailVerifiedAt: new Date(),
    })
    .returning();

  return user!;
}

/** A provisioned purchase whose Org Event the Organizer has activated. */
async function makeLivePurchase(suffix = "live") {
  const buyer = await makeUser(`buyer_${suffix}`);
  const result = await provision.execute({
    reference: `cs_${suffix}`,
    buyer: { name: "Ada Organizer", email: buyer.email },
    paymentIntentId: `pi_${suffix}`,
    purchase: {
      eventTier: "regional",
      orgName: `Summit ${suffix}`,
      eventName: "Summit 2026",
      startDate: "2026-06-13",
      endDate: "2026-06-14",
    },
  });

  await db
    .update(orgEvents)
    .set({ isActive: true })
    .where(eq(orgEvents.id, result.event.id));

  return { ...result, buyer };
}

/**
 * What an Org has built up by the time a chargeback lands: a Coach and a Dancer
 * on the roster, the Coach's note, rating and callback on the Dancer, a
 * published callback, and the Account Tier the event granted the Dancer.
 */
async function makeScoutingData(eventId: string) {
  const dancer = await makeUser("dancer");
  await db
    .update(users)
    .set({ orgAccountTier: "standard" })
    .where(eq(users.id, dancer.id));

  const [coachRoster, dancerRoster] = await db
    .insert(eventRosters)
    .values([
      {
        eventId,
        type: "coach",
        email: "coach@example.com",
        firstName: "Cora",
        lastName: "Coach",
      },
      {
        eventId,
        userId: dancer.id,
        type: "dancer",
        email: dancer.email,
        firstName: dancer.firstName,
        lastName: dancer.lastName,
        paid: true,
      },
    ])
    .returning();

  const pair = {
    eventId,
    coachRosterId: coachRoster!.id,
    dancerRosterId: dancerRoster!.id,
  };

  await db.insert(eventNotes).values({ ...pair, content: "Strong turns" });
  await db.insert(eventRatings).values({ ...pair, rating: 5 });

  const [showcase] = await db
    .insert(eventShowcases)
    .values({ eventId, number: 1 })
    .returning();
  await db.insert(eventCallbacks).values({ ...pair, showcaseId: showcase!.id });
  await db.insert(publishedCallbacks).values({
    showcaseId: showcase!.id,
    coachRosterId: coachRoster!.id,
    dancerRosterId: dancerRoster!.id,
    rank: 1,
  });

  const [grant] = await db
    .insert(premiumGrants)
    .values({
      userId: dancer.id,
      sourceType: "org_event",
      sourceId: eventId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    })
    .returning();

  return { dancer, grant: grant! };
}

async function countFor(eventId: string) {
  const count = async (query: Promise<unknown[]>) => {
    const rows = await query;
    return rows.length;
  };

  return {
    rosters: await count(
      db.select().from(eventRosters).where(eq(eventRosters.eventId, eventId))
    ),
    notes: await count(
      db.select().from(eventNotes).where(eq(eventNotes.eventId, eventId))
    ),
    ratings: await count(
      db.select().from(eventRatings).where(eq(eventRatings.eventId, eventId))
    ),
    callbacks: await count(
      db
        .select()
        .from(eventCallbacks)
        .where(eq(eventCallbacks.eventId, eventId))
    ),
    showcases: await count(
      db
        .select()
        .from(eventShowcases)
        .where(eq(eventShowcases.eventId, eventId))
    ),
    published: await count(db.select().from(publishedCallbacks)),
  };
}

async function isActive(eventId: string) {
  const row = await eventRow(eventId);
  return row.isActive;
}

async function eventRow(eventId: string) {
  const [row] = await db
    .select()
    .from(orgEvents)
    .where(eq(orgEvents.id, eventId));
  return row!;
}

async function wipe() {
  await db.delete(eventAuditLog).execute();
  await db.delete(csvUploads).execute();
  await db.delete(eventTierPurchases).execute();
  await db.delete(orgEvents).execute();
  await db.delete(orgMemberships).execute();
  await db.delete(users).execute();
  await db.delete(organizations).execute();
}

test.group("DeactivatePurchaseService", (group) => {
  group.each.setup(async () => {
    await wipe();
    mail.fake();
  });

  // `event_tier_purchases.buyer_id` is ON DELETE RESTRICT, so rows left behind
  // here would break the blanket `delete(users)` other suites run.
  group.each.teardown(async () => {
    mail.restore();
    await db.delete(eventTierPurchases).execute();
  });

  test("a refunded purchase leaves its Org Event inactive and records why on the sale", async ({
    assert,
  }) => {
    const { event, purchase } = await makeLivePurchase();

    const result = await svc.execute({
      paymentIntentId: "pi_live",
      reason: "refunded",
      providerReference: "ch_refunded",
    });

    assert.equal(result.outcome, "deactivated");
    assert.isFalse(await isActive(event.id));

    const [sale] = await db
      .select()
      .from(eventTierPurchases)
      .where(eq(eventTierPurchases.id, purchase.id));
    assert.exists(sale!.deactivatedAt);
    assert.equal(sale!.deactivationReason, "refunded");
    assert.equal(sale!.deactivationReference, "ch_refunded");
    // The sale itself stands: what was bought does not stop having been bought.
    assert.equal(sale!.eventTier, "regional");
    assert.equal(sale!.reference, "cs_live");
  });

  test("a disputed purchase leaves its Org Event inactive", async ({
    assert,
  }) => {
    const { event } = await makeLivePurchase();

    const result = await svc.execute({
      paymentIntentId: "pi_live",
      reason: "disputed",
      providerReference: "dp_opened",
    });

    assert.equal(result.outcome, "deactivated");
    assert.isFalse(await isActive(event.id));
    if (result.outcome === "deactivated") {
      assert.equal(result.purchase.deactivationReason, "disputed");
      assert.equal(result.purchase.deactivationReference, "dp_opened");
    }
  });

  test("the event's Roster Entries, notes, ratings and callbacks are intact afterwards", async ({
    assert,
  }) => {
    const { event } = await makeLivePurchase();
    await makeScoutingData(event.id);
    const before = await countFor(event.id);

    await svc.execute({
      paymentIntentId: "pi_live",
      reason: "disputed",
      providerReference: "dp_roster",
    });

    const after = await countFor(event.id);
    assert.deepEqual(after, before);
    assert.deepEqual(after, {
      rosters: 2,
      notes: 1,
      ratings: 1,
      callbacks: 1,
      showcases: 1,
      published: 1,
    });

    // The event is stood down, not torn down.
    const row = await eventRow(event.id);
    assert.equal(row.name, "Summit 2026");
    assert.equal(row.eventTier, "regional");
  });

  test("Account Tiers already granted to Dancers are unaffected", async ({
    assert,
  }) => {
    const { event } = await makeLivePurchase();
    const { dancer, grant } = await makeScoutingData(event.id);

    await svc.execute({
      paymentIntentId: "pi_live",
      reason: "refunded",
      providerReference: "ch_grant",
    });

    const [grantAfter] = await db
      .select()
      .from(premiumGrants)
      .where(eq(premiumGrants.id, grant.id));
    assert.isNull(grantAfter!.revokedAt);
    assert.equal(
      grantAfter!.expiresAt.toISOString(),
      grant.expiresAt.toISOString()
    );

    const [dancerAfter] = await db
      .select({ orgAccountTier: users.orgAccountTier })
      .from(users)
      .where(eq(users.id, dancer.id));
    assert.equal(dancerAfter!.orgAccountTier, "standard");
  });

  test("staff are notified when it happens", async ({ assert }) => {
    const fake = mail.fake();
    const { event } = await makeLivePurchase();

    await svc.execute({
      paymentIntentId: "pi_live",
      reason: "disputed",
      providerReference: "dp_notify",
    });

    fake.mails.assertSentCount(PurchaseDeactivatedEmail, 1);
    fake.mails.assertSent(PurchaseDeactivatedEmail, (message) => {
      assert.include(message.subject, "disputed");
      assert.include(message.subject, event.name);
      assert.include(message.subject, "Summit live");
      return true;
    });
  });

  test("a redelivered refund, or a dispute after a refund, changes nothing and notifies once", async ({
    assert,
  }) => {
    const fake = mail.fake();
    const { event, purchase } = await makeLivePurchase();

    const first = await svc.execute({
      paymentIntentId: "pi_live",
      reason: "refunded",
      providerReference: "ch_once",
    });
    const redelivered = await svc.execute({
      paymentIntentId: "pi_live",
      reason: "refunded",
      providerReference: "ch_once",
    });
    const disputed = await svc.execute({
      paymentIntentId: "pi_live",
      reason: "disputed",
      providerReference: "dp_after",
    });

    assert.equal(first.outcome, "deactivated");
    assert.equal(redelivered.outcome, "already_deactivated");
    assert.equal(disputed.outcome, "already_deactivated");

    const [sale] = await db
      .select()
      .from(eventTierPurchases)
      .where(eq(eventTierPurchases.id, purchase.id));
    assert.equal(sale!.deactivationReason, "refunded");
    assert.equal(sale!.deactivationReference, "ch_once");
    assert.isFalse(await isActive(event.id));
    fake.mails.assertSentCount(PurchaseDeactivatedEmail, 1);
  });

  test("a payment that bought no Org Event, such as a Dancer subscription, is left alone", async ({
    assert,
  }) => {
    const fake = mail.fake();
    const { event } = await makeLivePurchase();

    const result = await svc.execute({
      paymentIntentId: "pi_subscription",
      reason: "refunded",
      providerReference: "ch_subscription",
    });

    assert.equal(result.outcome, "not_an_event_tier_purchase");
    assert.isTrue(await isActive(event.id));
    // The purchase itself emailed its buyer; staff hear nothing.
    fake.mails.assertNotSent(PurchaseDeactivatedEmail);
  });

  test("only the purchased event is stood down; the Org's other events are untouched and none is promoted", async ({
    assert,
  }) => {
    const { event, org } = await makeLivePurchase();
    const [other] = await db
      .insert(orgEvents)
      .values({
        orgId: org.id,
        name: "Next Season",
        startDate: "2099-01-01",
        endDate: "2099-01-02",
      })
      .returning();

    await svc.execute({
      paymentIntentId: "pi_live",
      reason: "refunded",
      providerReference: "ch_other",
    });

    assert.isFalse(await isActive(event.id));
    assert.isFalse(await isActive(other!.id));
  });

  test("an Org left with no active event behaves sensibly rather than erroring", async ({
    assert,
  }) => {
    const { event, org, buyer } = await makeLivePurchase();

    await svc.execute({
      paymentIntentId: "pi_live",
      reason: "disputed",
      providerReference: "dp_empty",
    });

    // The Org still loads for its Organizer, with no capabilities in force.
    const access = await new GetOrgService(dbService).execute(
      org.slug,
      buyer.id
    );
    assert.exists(access);
    assert.equal(access!.membership?.type, "organizer");
    assert.deepEqual(access!.activeEventCapabilities, []);

    // The admin area still lists the event, now inactive, to pick and view.
    const events = await new ListEventsService(dbService).execute(org.id);
    assert.deepEqual(
      events.map((e) => [e.id, e.isActive]),
      [[event.id, false]]
    );

    // Event-scoped routes answer "no active event" instead of failing.
    let notFound: { message: string } | null = null;
    let nextCalled = false;
    const ctx = {
      org,
      params: {},
      request: { input: () => undefined, header: () => undefined },
      auth: {
        getUserOrFail: () => {
          throw new Error("not authed");
        },
      },
      response: {
        notFound: (body: { message: string }) => {
          notFound = body;
        },
      },
    } as unknown as HttpContext;
    await new OrgEventMiddleware().handle(ctx, async () => {
      nextCalled = true;
    });
    assert.isFalse(nextCalled);
    assert.match(notFound!.message, /no active event/i);
  });

  test("an Organizer cannot reactivate a refunded event; staff can once it is resolved", async ({
    assert,
  }) => {
    const { event, org, buyer } = await makeLivePurchase();
    const staff = await makeUser("staff", "admin");

    await svc.execute({
      paymentIntentId: "pi_live",
      reason: "refunded",
      providerReference: "ch_reactivate",
    });

    await assert.rejects(
      () =>
        update.execute(
          org.id,
          event.id,
          { isActive: true },
          { eventId: event.id, actorId: buyer.id },
          { isStaff: false }
        ),
      DeactivatedPurchaseActivateError
    );
    assert.isFalse(await isActive(event.id));

    await update.execute(
      org.id,
      event.id,
      { isActive: true },
      { eventId: event.id, actorId: staff.id },
      { isStaff: true }
    );
    assert.isTrue(await isActive(event.id));
  });
});
