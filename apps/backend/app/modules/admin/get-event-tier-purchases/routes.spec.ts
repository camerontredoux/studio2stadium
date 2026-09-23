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
import { ProvisionPurchaseService } from "#modules/event-tiers/provisioning/service";
import { resolveCapabilities } from "#shared/org/entitlement";
import hash from "@adonisjs/core/services/hash";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { eq } from "drizzle-orm";

const PASSWORD = "purchases-admin-test-password";
const provision = new ProvisionPurchaseService(new DatabaseService());

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

async function makeUser(name: string, role: "admin" | "user") {
  const email = `${name}@example.com`;
  const [user] = await db
    .insert(users)
    .values({
      username: name,
      email,
      displayEmail: email,
      firstName: name,
      lastName: "Tester",
      password: await hash.make(PASSWORD),
      role,
      type: "dancer",
      verified: true,
    })
    .returning();
  return user!;
}

async function tokenFor(client: ApiClient, email: string) {
  const res = await client
    .post("/auth/login")
    .header("X-Client-Type", "mobile")
    .json({ email, password: PASSWORD });
  res.assertStatus(200);
  return (res.body() as { token: string }).token;
}

/** A paid, provisioned purchase: the buyer, their Org and the bought event. */
async function purchase(buyerName: string) {
  const buyer = await makeUser(buyerName, "user");
  const result = await provision.execute({
    reference: `cs_${buyerName}`,
    buyerUserId: buyer.id,
    purchase: {
      eventTier: "regional",
      orgName: `${buyerName} Dance Co`,
      eventName: "Summit 2026",
      startDate: "2026-06-13",
      endDate: "2026-06-14",
    },
    paymentIntentId: `pi_${buyerName}`,
    amountTotal: 49900,
    currency: "usd",
  });
  return { buyer, ...result };
}

interface PurchaseRow {
  id: string;
  eventTier: string;
  amountTotal: number | null;
  currency: string | null;
  buyer: { id: string; email: string; firstName: string; lastName: string };
  event: { id: string; name: string; eventTier: string };
  org: { id: string; name: string; slug: string };
  lastEventTierChange: {
    from: string | null;
    to: string;
    changedAt: string;
    changedBy: { id: string; email: string };
  } | null;
}

test.group("Admin Event Tier purchases (#92)", (group) => {
  group.each.setup(async () => {
    await wipe();
  });

  // `event_tier_purchases.buyer_id` is ON DELETE RESTRICT; don't leave rows
  // behind for other suites' blanket `delete(users)`.
  group.each.teardown(async () => {
    await db.delete(eventTierPurchases).execute();
  });

  test("staff see each purchase with its buyer, Event Tier, Org Event and amount", async ({
    client,
    assert,
  }) => {
    const staff = await makeUser("staff_list", "admin");
    const { buyer, event, org } = await purchase("buyer_list");

    const res = await client
      .get("/admin/event-tier-purchases")
      .header("Authorization", `Bearer ${await tokenFor(client, staff.email)}`);

    res.assertStatus(200);
    const rows = res.body() as PurchaseRow[];
    assert.lengthOf(rows, 1);
    const [row] = rows;
    assert.equal(row!.buyer.id, buyer.id);
    assert.equal(row!.buyer.email, buyer.displayEmail);
    assert.equal(row!.eventTier, "regional");
    assert.equal(row!.event.id, event.id);
    assert.equal(row!.event.name, "Summit 2026");
    assert.equal(row!.org.slug, org.slug);
    assert.equal(row!.amountTotal, 49900);
    assert.equal(row!.currency, "usd");
    assert.isNull(row!.lastEventTierChange);
  });

  test("a platform admin changes an Org Event's Event Tier, and the list shows who and when", async ({
    client,
    assert,
  }) => {
    const staff = await makeUser("staff_change", "admin");
    const { event, org } = await purchase("buyer_change");
    const token = await tokenFor(client, staff.email);

    const before = new Date();
    const patch = await client
      .patch(`/orgs/${org.slug}/events/${event.id}`)
      .header("Authorization", `Bearer ${token}`)
      .json({ eventTier: "national" });
    patch.assertStatus(200);

    const res = await client
      .get("/admin/event-tier-purchases")
      .header("Authorization", `Bearer ${token}`);
    res.assertStatus(200);
    const [row] = res.body() as PurchaseRow[];

    // The event is at the new tier; the sale still says what was paid for.
    assert.equal(row!.event.eventTier, "national");
    assert.equal(row!.eventTier, "regional");
    assert.equal(row!.lastEventTierChange!.from, "regional");
    assert.equal(row!.lastEventTierChange!.to, "national");
    assert.equal(row!.lastEventTierChange!.changedBy.id, staff.id);
    assert.equal(row!.lastEventTierChange!.changedBy.email, staff.displayEmail);
    assert.isAtLeast(
      new Date(row!.lastEventTierChange!.changedAt).getTime(),
      before.getTime() - 1000
    );
  });

  test("changing an Event Tier changes that event's entitlement and no other event's", async ({
    client,
    assert,
  }) => {
    const staff = await makeUser("staff_scope", "admin");
    const { event, org } = await purchase("buyer_scope");
    const [sibling] = await db
      .insert(orgEvents)
      .values({
        orgId: org.id,
        name: "Summit 2027",
        startDate: "2027-06-13",
        endDate: "2027-06-14",
        eventTier: "core",
      })
      .returning();
    const siblingCapsBefore = resolveCapabilities(sibling);

    const patch = await client
      .patch(`/orgs/${org.slug}/events/${event.id}`)
      .header("Authorization", `Bearer ${await tokenFor(client, staff.email)}`)
      .json({ eventTier: "enterprise" });
    patch.assertStatus(200);

    const [changed] = await db
      .select()
      .from(orgEvents)
      .where(eq(orgEvents.id, event.id));
    const [untouched] = await db
      .select()
      .from(orgEvents)
      .where(eq(orgEvents.id, sibling!.id));

    assert.equal(changed!.eventTier, "enterprise");
    assert.deepEqual(
      resolveCapabilities(changed),
      resolveCapabilities({ ...changed!, eventTier: "enterprise" })
    );
    assert.notDeepEqual(
      resolveCapabilities(changed),
      resolveCapabilities({ ...changed!, eventTier: "regional" })
    );
    assert.equal(untouched!.eventTier, "core");
    assert.deepEqual(resolveCapabilities(untouched), siblingCapsBefore);
  });

  test("a signed-out visitor cannot list purchases", async ({ client }) => {
    const res = await client.get("/admin/event-tier-purchases");
    res.assertStatus(401);
  });

  test("the buyer, an Organizer of the Org, can neither list purchases nor change the Event Tier", async ({
    client,
    assert,
  }) => {
    const { buyer, event, org } = await purchase("buyer_denied");
    const token = await tokenFor(client, buyer.email);

    const list = await client
      .get("/admin/event-tier-purchases")
      .header("Authorization", `Bearer ${token}`);
    list.assertStatus(403);

    const patch = await client
      .patch(`/orgs/${org.slug}/events/${event.id}`)
      .header("Authorization", `Bearer ${token}`)
      .json({ eventTier: "enterprise" });
    patch.assertStatus(403);

    const [unchanged] = await db
      .select()
      .from(orgEvents)
      .where(eq(orgEvents.id, event.id));
    assert.equal(unchanged!.eventTier, "regional");
  });
});
