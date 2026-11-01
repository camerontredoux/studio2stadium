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
import { seedOrganizations } from "#commands/backfill-organizations";
import { eq } from "drizzle-orm";
import { DeleteEventService, PurchasedEventDeleteError } from "./service.ts";
import DeleteEventController from "./controller.ts";

const svc = new DeleteEventService(new DatabaseService());

async function summitId() {
  const [summit] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "summit"));
  return summit!.id;
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

test.group("DeleteEventService purchased events (#112)", (group) => {
  group.each.setup(async () => {
    await db.delete(eventTierPurchases).execute();
    await db.delete(eventAuditLog).execute();
    await db.delete(csvUploads).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();
  });

  // `event_tier_purchases.buyer_id` is ON DELETE RESTRICT, so rows left behind
  // here would break the blanket `delete(users)` other suites run.
  group.each.teardown(async () => {
    await db.delete(eventTierPurchases).execute();
  });

  test("a bought event cannot be deleted, and its sale record stays", async ({
    assert,
  }) => {
    const orgId = await summitId();
    const ev = await makeEvent(orgId);
    const buyer = await makeBuyer();
    await db.insert(eventTierPurchases).values({
      reference: `cs_test_${Date.now()}`,
      buyerId: buyer.id,
      eventId: ev.id,
      eventTier: "core",
    });

    await assert.rejects(
      () => svc.execute(orgId, ev.id),
      PurchasedEventDeleteError
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

  test("an event nobody bought is still deleted", async ({ assert }) => {
    const orgId = await summitId();
    const ev = await makeEvent(orgId);

    assert.isTrue(await svc.execute(orgId, ev.id));
    assert.lengthOf(
      await db.select().from(orgEvents).where(eq(orgEvents.id, ev.id)),
      0
    );
  });
});

test.group("DeleteEventController mock", () => {
  test("a bought event is a 409", async ({ assert }) => {
    let status: number | null = null;
    const ctx = {
      org: { id: "test-org-id" },
      params: { id: "test-event-id" },
      response: {
        noContent: () => (status = 204),
        notFound: () => (status = 404),
        conflict: () => (status = 409),
      },
    } as unknown as Parameters<DeleteEventController["handle"]>[0];
    const service = {
      execute: async () => {
        throw new PurchasedEventDeleteError();
      },
    } as unknown as DeleteEventService;

    await new DeleteEventController().handle(ctx, service);
    assert.equal(status, 409);
  });
});
