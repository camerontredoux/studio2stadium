import { test } from "@japa/runner";
import { db } from "#database/connection";
import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import {
  csvUploads,
  eventAuditLog,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { eq, like } from "drizzle-orm";
import { PurchasedOrgDeleteError, Service } from "./service.ts";
import DeleteOrgController from "./controller.ts";

const svc = new Service(new DatabaseService());

async function makeOrg() {
  const ts = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const [org] = await db
    .insert(organizations)
    .values({ name: `Org ${ts}`, slug: `delete-org-spec-${ts}` })
    .returning();
  return org!;
}

async function makeEvent(orgId: string) {
  const [ev] = await db
    .insert(orgEvents)
    .values({
      orgId,
      name: "Bought Event",
      startDate: "2026-09-01",
      endDate: "2026-09-02",
      eventTier: "core",
    })
    .returning();
  return ev!;
}

async function makeBuyer() {
  const ts = `${Date.now()}_${Math.random()}`;
  const [buyer] = await db
    .insert(users)
    .values({
      username: `buyer_${ts}`,
      email: `buyer_${ts}@example.com`,
      displayEmail: `buyer_${ts}@example.com`,
      firstName: "Buyer",
      lastName: "User",
      password: "h",
      role: "user",
      type: "dancer",
    })
    .returning();
  return buyer!;
}

async function buy(eventId: string) {
  const buyer = await makeBuyer();
  await db.insert(eventTierPurchases).values({
    reference: `cs_test_${Date.now()}_${Math.random()}`,
    buyerId: buyer.id,
    eventId,
    eventTier: "core",
  });
}

test.group("Admin delete Org keeps sale records (#84)", (group) => {
  group.each.setup(async () => {
    await db.delete(eventTierPurchases).execute();
    await db.delete(eventAuditLog).execute();
    await db.delete(csvUploads).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(users).execute();
  });

  // `event_tier_purchases` restricts deletes of both its buyer and its event,
  // so rows left behind here would break the blanket deletes other suites run.
  group.each.teardown(async () => {
    await db.delete(eventTierPurchases).execute();
    await db
      .delete(organizations)
      .where(like(organizations.slug, "delete-org-spec-%"))
      .execute();
  });

  test("an Org with a purchased event cannot be deleted, and its sale record stays", async ({
    assert,
  }) => {
    const org = await makeOrg();
    const ev = await makeEvent(org.id);
    await buy(ev.id);

    await assert.rejects(
      () => svc.execute({ params: { id: org.id } }),
      PurchasedOrgDeleteError
    );
    assert.lengthOf(
      await db.select().from(organizations).where(eq(organizations.id, org.id)),
      1
    );
    assert.lengthOf(
      await db.select().from(orgEvents).where(eq(orgEvents.id, ev.id)),
      1
    );
    assert.lengthOf(
      await db
        .select()
        .from(eventTierPurchases)
        .where(eq(eventTierPurchases.eventId, ev.id)),
      1
    );
  });

  test("a deactivated purchase still blocks the delete", async ({ assert }) => {
    const org = await makeOrg();
    const ev = await makeEvent(org.id);
    await buy(ev.id);
    await db
      .update(eventTierPurchases)
      .set({ deactivatedAt: new Date(), deactivationReason: "refunded" })
      .where(eq(eventTierPurchases.eventId, ev.id));

    await assert.rejects(
      () => svc.execute({ params: { id: org.id } }),
      PurchasedOrgDeleteError
    );
  });

  test("an Org nobody bought an event in is still deleted with its events", async ({
    assert,
  }) => {
    const org = await makeOrg();
    const ev = await makeEvent(org.id);

    assert.isTrue(await svc.execute({ params: { id: org.id } }));
    assert.lengthOf(
      await db.select().from(organizations).where(eq(organizations.id, org.id)),
      0
    );
    assert.lengthOf(
      await db.select().from(orgEvents).where(eq(orgEvents.id, ev.id)),
      0
    );
  });

  test("another Org's purchase does not block the delete", async ({
    assert,
  }) => {
    const other = await makeOrg();
    const otherEvent = await makeEvent(other.id);
    await buy(otherEvent.id);
    const org = await makeOrg();
    await makeEvent(org.id);

    assert.isTrue(await svc.execute({ params: { id: org.id } }));
    assert.lengthOf(await db.select().from(eventTierPurchases), 1);
  });

  test("an unknown Org reports not found", async ({ assert }) => {
    assert.isFalse(
      await svc.execute({
        params: { id: "00000000-0000-0000-0000-000000000000" },
      })
    );
  });

  test("the database refuses to cascade a purchased event away", async ({
    assert,
  }) => {
    const org = await makeOrg();
    const ev = await makeEvent(org.id);
    await buy(ev.id);

    // Even past the service guard, deleting the Org (which cascades to its
    // events) must fail rather than silently erase the sale.
    await assert.rejects(() =>
      db.delete(organizations).where(eq(organizations.id, org.id)).execute()
    );
    await assert.rejects(() =>
      db.delete(orgEvents).where(eq(orgEvents.id, ev.id)).execute()
    );
    assert.lengthOf(
      await db
        .select()
        .from(eventTierPurchases)
        .where(eq(eventTierPurchases.eventId, ev.id)),
      1
    );
  });
});

test.group("DeleteOrgController mock", () => {
  test("an Org with a purchase is a 409 carrying the reason", async ({
    assert,
  }) => {
    let status: number | null = null;
    let body: unknown = null;
    const ctx = {
      request: {
        validateUsing: async () => ({ params: { id: "test-org-id" } }),
      },
      response: {
        noContent: () => (status = 204),
        conflict: (b: unknown) => {
          status = 409;
          body = b;
        },
      },
    } as unknown as Parameters<DeleteOrgController["handle"]>[0];
    const service = {
      execute: async () => {
        throw new PurchasedOrgDeleteError();
      },
    } as unknown as Service;

    await new DeleteOrgController().handle(ctx, service);
    assert.equal(status, 409);
    assert.deepEqual(body, { message: new PurchasedOrgDeleteError().message });
  });
});
