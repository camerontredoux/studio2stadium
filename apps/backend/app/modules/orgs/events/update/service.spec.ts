import { test } from "@japa/runner";
import { db } from "#database/connection";
import { DatabaseService } from "#database/service";
import {
  csvUploads,
  eventAuditLog,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { seedOrganizations } from "#commands/backfill-organizations";
import { EventTierForbiddenError } from "#shared/org/event-tier-authority";
import type { EventTier } from "#shared/org/event-tiers";
import { eq } from "drizzle-orm";
import { UpdateEventService } from "./service.ts";
import UpdateEventController from "./controller.ts";
import { ListEventsService } from "../list/service.ts";

const svc = new UpdateEventService(new DatabaseService());

async function makeUser(role: "admin" | "user") {
  const ts = `${Date.now()}_${Math.random()}`;
  const [user] = await db
    .insert(users)
    .values({
      username: `u_${ts}`,
      email: `u_${ts}@example.com`,
      displayEmail: `u_${ts}@example.com`,
      firstName: "Test",
      lastName: "User",
      password: "h",
      role,
      type: "dancer",
    })
    .returning();
  return user!;
}

async function makeEvent(eventTier?: EventTier) {
  const [summit] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "summit"));
  const [ev] = await db
    .insert(orgEvents)
    .values({
      orgId: summit!.id,
      name: "Summit 2026",
      startDate: "2026-06-13",
      endDate: "2026-06-14",
      ...(eventTier && { eventTier }),
    })
    .returning();
  return ev!;
}

function auditRows(eventId: string) {
  return db
    .select()
    .from(eventAuditLog)
    .where(eq(eventAuditLog.eventId, eventId));
}

test.group("UpdateEventService Event Tier (#112)", (group) => {
  group.each.setup(async () => {
    await db.delete(eventAuditLog).execute();
    await db.delete(csvUploads).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();
  });

  test("staff can change an existing Org Event's Event Tier", async ({
    assert,
  }) => {
    const staff = await makeUser("admin");
    const ev = await makeEvent();

    const updated = await svc.execute(
      ev.orgId,
      ev.id,
      { eventTier: "national" },
      { eventId: ev.id, actorId: staff.id },
      { isStaff: true }
    );

    assert.equal(updated!.eventTier, "national");
    const [stored] = await db
      .select()
      .from(orgEvents)
      .where(eq(orgEvents.id, ev.id));
    assert.equal(stored!.eventTier, "national");
  });

  test("a change records who made it, when, and what it changed from", async ({
    assert,
  }) => {
    const staff = await makeUser("admin");
    const ev = await makeEvent("core");
    const startedAt = new Date(Date.now() - 1000);

    await svc.execute(
      ev.orgId,
      ev.id,
      { eventTier: "regional" },
      { eventId: ev.id, actorId: staff.id },
      { isStaff: true }
    );

    const rows = await auditRows(ev.id);
    assert.lengthOf(rows, 1);
    const [entry] = rows;
    assert.equal(entry!.action, "update");
    assert.equal(entry!.resource, "event");
    assert.equal(entry!.resourceId, ev.id);
    assert.equal(entry!.actorId, staff.id);
    assert.isAtLeast(entry!.createdAt.getTime(), startedAt.getTime());
    assert.deepEqual(entry!.metadata, {
      diff: { eventTier: { from: "core", to: "regional" } },
    });
  });

  test("the Event Tier change is recorded alongside other edits in the same save", async ({
    assert,
  }) => {
    const staff = await makeUser("admin");
    const ev = await makeEvent("core");

    await svc.execute(
      ev.orgId,
      ev.id,
      { name: "Renamed", eventTier: "enterprise" },
      { eventId: ev.id, actorId: staff.id },
      { isStaff: true }
    );

    const rows = await auditRows(ev.id);
    assert.lengthOf(rows, 2);
    const tierEntry = rows.find(
      (r) => (r.metadata as { diff?: unknown } | null)?.diff !== undefined
    );
    assert.deepEqual(tierEntry!.metadata, {
      diff: { eventTier: { from: "core", to: "enterprise" } },
    });

    // The general entry does not repeat the tier change already recorded.
    const generalEntry = rows.find((r) => r !== tierEntry);
    const general = generalEntry!.metadata as {
      before: Record<string, unknown>;
      after: Record<string, unknown>;
    };
    assert.equal(general.after.name, "Renamed");
    assert.notProperty(general.before, "eventTier");
    assert.notProperty(general.after, "eventTier");
  });

  test("re-saving the same Event Tier records no tier change", async ({
    assert,
  }) => {
    const staff = await makeUser("admin");
    const ev = await makeEvent("national");

    await svc.execute(
      ev.orgId,
      ev.id,
      { eventTier: "national" },
      { eventId: ev.id, actorId: staff.id },
      { isStaff: true }
    );

    assert.lengthOf(await auditRows(ev.id), 0);
  });

  test("someone other than staff cannot change an Event Tier", async ({
    assert,
  }) => {
    const organizer = await makeUser("user");
    const ev = await makeEvent("core");

    await assert.rejects(
      () =>
        svc.execute(
          ev.orgId,
          ev.id,
          { eventTier: "enterprise" },
          { eventId: ev.id, actorId: organizer.id },
          { isStaff: false }
        ),
      EventTierForbiddenError
    );

    const [stored] = await db
      .select()
      .from(orgEvents)
      .where(eq(orgEvents.id, ev.id));
    assert.equal(stored!.eventTier, "core");
    assert.lengthOf(await auditRows(ev.id), 0);
  });

  test("editing other fields without an Event Tier leaves it alone", async ({
    assert,
  }) => {
    const organizer = await makeUser("user");
    const ev = await makeEvent("regional");

    const updated = await svc.execute(
      ev.orgId,
      ev.id,
      { name: "Renamed" },
      { eventId: ev.id, actorId: organizer.id }
    );

    assert.equal(updated!.eventTier, "regional");
  });

  test("the Org Event list carries each event's Event Tier", async ({
    assert,
  }) => {
    const ev = await makeEvent("core");
    const events = await new ListEventsService(new DatabaseService()).execute(
      ev.orgId
    );
    assert.equal(events.find((e) => e.id === ev.id)!.eventTier, "core");
  });
});

test.group("UpdateEventController Event Tier mock", () => {
  test("passes staff status from the site role and answers 403 when refused", async ({
    assert,
  }) => {
    const seen: boolean[] = [];
    let status: number | null = null;
    const service = {
      execute: async (
        _orgId: string,
        _eventId: string,
        _patch: unknown,
        _audit: unknown,
        actor: { isStaff: boolean }
      ) => {
        seen.push(actor.isStaff);
        throw new EventTierForbiddenError();
      },
    } as unknown as UpdateEventService;
    const ctx = {
      org: { id: "test-org-id" },
      params: { id: "00000000-0000-0000-0000-000000000002" },
      auth: {
        getUserOrFail: () => ({
          id: "00000000-0000-0000-0000-000000000001",
          role: "user",
        }),
      },
      request: { validateUsing: async () => ({ eventTier: "enterprise" }) },
      response: {
        ok: () => (status = 200),
        notFound: () => (status = 404),
        forbidden: () => (status = 403),
        unprocessableEntity: () => (status = 422),
      },
    } as unknown as Parameters<UpdateEventController["handle"]>[0];

    await new UpdateEventController().handle(ctx, service);

    assert.deepEqual(seen, [false]);
    assert.equal(status, 403);
  });
});
