import { test } from "@japa/runner";
import { db } from "#database/connection";
import { organizations, orgMemberships } from "#database/schema/organizations";
import {
  orgEvents,
  eventRosters,
  csvUploads,
  eventAuditLog,
} from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { seedOrganizations } from "#commands/backfill-organizations";
import { CreateEventService } from "./service.ts";
import { DatabaseService } from "#database/service";
import { eq } from "drizzle-orm";
import { E_DATABASE_ERROR } from "#exceptions/database";
import { ListRosterService } from "../rosters/list/service.ts";
import CreateEventController from "./controller.ts";
import OrgAdminMiddleware from "#middleware/routes/org-admin";
import {
  EventTierForbiddenError,
  EventTierRequiredError,
} from "#shared/org/event-tier-authority";

const svc = new CreateEventService(new DatabaseService());

async function makeActorUser() {
  const ts = `${Date.now()}_${Math.random()}`;
  const [actor] = await db
    .insert(users)
    .values({
      username: `actor_${ts}`,
      email: `actor_${ts}@example.com`,
      displayEmail: `actor_${ts}@example.com`,
      firstName: "Actor",
      lastName: "User",
      password: "h",
      role: "admin",
      type: "dancer",
    })
    .returning();
  return actor!;
}

test.group("CreateEventService", (group) => {
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

  test("creates an event for an org", async ({ assert }) => {
    const actor = await makeActorUser();
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    const ev = await svc.execute(
      summit!.id,
      {
        name: "Summit 2026",
        startDate: "2026-06-13",
        endDate: "2026-06-14",
        venueName: "Boston Garden",
        isActive: true,
      },
      actor.id
    );
    assert.equal(ev.name, "Summit 2026");
    assert.isTrue(ev.isActive);
    assert.equal(ev.orgId, summit!.id);
  });

  test("throws E_UNIQUE_VIOLATION when a second active event is created", async ({
    assert,
  }) => {
    const actor = await makeActorUser();
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));

    await svc.execute(
      summit!.id,
      {
        name: "First",
        startDate: "2026-06-13",
        endDate: "2026-06-14",
        isActive: true,
      },
      actor.id
    );

    let caught: any;
    try {
      await svc.execute(
        summit!.id,
        {
          name: "Second",
          startDate: "2026-07-01",
          endDate: "2026-07-02",
          isActive: true,
        },
        actor.id
      );
    } catch (err) {
      caught = err;
    }
    assert.exists(caught, "expected an error to be thrown");
    assert.equal(caught.code, "E_UNIQUE_VIOLATION");
  });

  test("inactive events do not trigger the unique constraint", async ({
    assert,
  }) => {
    const actor = await makeActorUser();
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));

    const ev1 = await svc.execute(
      summit!.id,
      {
        name: "Inactive A",
        startDate: "2026-06-13",
        endDate: "2026-06-14",
        isActive: false,
      },
      actor.id
    );
    const ev2 = await svc.execute(
      summit!.id,
      {
        name: "Inactive B",
        startDate: "2026-07-01",
        endDate: "2026-07-02",
        isActive: false,
      },
      actor.id
    );
    assert.isFalse(ev1.isActive);
    assert.isFalse(ev2.isActive);
  });

  test("the creator does not appear in the event's coach roster", async ({
    assert,
  }) => {
    const actor = await makeActorUser();
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));

    const ev = await svc.execute(
      summit!.id,
      {
        name: "Creator Roster",
        startDate: "2026-06-13",
        endDate: "2026-06-14",
        isActive: true,
      },
      actor.id
    );

    const coaches = await new ListRosterService(new DatabaseService()).execute(
      ev.id,
      { type: "coach" }
    );
    assert.lengthOf(coaches.data, 0);
    assert.equal(coaches.total, 0);

    // The row still exists to anchor FKs — it is just flagged as staff, exactly
    // as "view as coach" would have provisioned it.
    const [row] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.eventId, ev.id));
    assert.exists(row);
    assert.equal(row!.userId, actor.id);
    assert.isTrue(row!.isStaff);
  });
});

test.group("CreateEventService Event Tier (#112)", (group) => {
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

  async function summitId() {
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    return summit!.id;
  }

  const details = {
    name: "Second Event",
    startDate: "2026-09-01",
    endDate: "2026-09-02",
  };

  test("staff create an Org Event with the Event Tier they choose", async ({
    assert,
  }) => {
    const actor = await makeActorUser();
    const ev = await svc.execute(
      await summitId(),
      { ...details, eventTier: "core" },
      actor.id,
      { isStaff: true }
    );

    assert.equal(ev.eventTier, "core");
    const [stored] = await db
      .select()
      .from(orgEvents)
      .where(eq(orgEvents.id, ev.id));
    assert.equal(stored!.eventTier, "core");
  });

  test("the create audit entry records the chosen Event Tier and who chose it", async ({
    assert,
  }) => {
    const actor = await makeActorUser();
    const ev = await svc.execute(
      await summitId(),
      { ...details, eventTier: "regional" },
      actor.id,
      { isStaff: true }
    );

    const [entry] = await db
      .select()
      .from(eventAuditLog)
      .where(eq(eventAuditLog.eventId, ev.id));
    assert.equal(entry!.action, "create");
    assert.equal(entry!.actorId, actor.id);
    const after = (entry!.metadata as { after: { eventTier: string } }).after;
    assert.equal(after.eventTier, "regional");
  });

  test("staff must choose an Event Tier rather than fall back to Enterprise", async ({
    assert,
  }) => {
    const actor = await makeActorUser();
    const orgId = await summitId();

    await assert.rejects(
      () => svc.execute(orgId, details, actor.id, { isStaff: true }),
      EventTierRequiredError
    );
    assert.lengthOf(
      await db.select().from(orgEvents).where(eq(orgEvents.orgId, orgId)),
      0
    );
  });

  test("someone other than staff cannot set an Event Tier", async ({
    assert,
  }) => {
    const actor = await makeActorUser();
    const orgId = await summitId();

    await assert.rejects(
      () =>
        svc.execute(orgId, { ...details, eventTier: "enterprise" }, actor.id, {
          isStaff: false,
        }),
      EventTierForbiddenError
    );
    assert.lengthOf(
      await db.select().from(orgEvents).where(eq(orgEvents.orgId, orgId)),
      0
    );
  });

  test("an event created without an Event Tier still takes the Enterprise column default", async ({
    assert,
  }) => {
    const actor = await makeActorUser();
    const ev = await svc.execute(await summitId(), details, actor.id);
    assert.equal(ev.eventTier, "enterprise");
    assert.equal(orgEvents.eventTier.default, "enterprise");
  });
});

test.group("POST /orgs/:slug/events middleware", (group) => {
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

  test("401 for unauthenticated request", async ({ client }) => {
    const res = await client.post("/orgs/summit/events").json({
      name: "X",
      startDate: "2026-06-13",
      endDate: "2026-06-14",
    });
    res.assertStatus(401);
  });
});

test.group("CreateEventController mock", () => {
  test("returns 409 when service throws unique violation", async ({
    assert,
  }) => {
    const conflictErr = new E_DATABASE_ERROR(
      "Unique (partial index) already exists",
      {
        code: "E_UNIQUE_VIOLATION",
        cause: "partial index",
      }
    );

    let statusCode: number | null = null;
    let responseBody: any = null;

    const mockCtx: any = {
      org: { id: "test-org-id" },
      params: { id: "" },
      auth: {
        getUserOrFail: () => ({ id: "00000000-0000-0000-0000-000000000001" }),
      },
      request: {
        validateUsing: async () => ({
          name: "E",
          startDate: "2026-06-13",
          endDate: "2026-06-14",
          isActive: true,
        }),
      },
      response: {
        created: (body: any) => {
          statusCode = 201;
          responseBody = body;
        },
        conflict: (body: any) => {
          statusCode = 409;
          responseBody = body;
        },
      },
    };

    const brokenService: any = {
      execute: async () => {
        throw conflictErr;
      },
    };

    await new CreateEventController().handle(mockCtx, brokenService);

    assert.equal(statusCode, 409);
    assert.match(responseBody.message, /active/i);
  });
});

test.group("CreateEventController Event Tier mock", () => {
  function ctxFor(role: string, record: { status: number | null }) {
    return {
      org: { id: "test-org-id" },
      params: {},
      auth: {
        getUserOrFail: () => ({
          id: "00000000-0000-0000-0000-000000000001",
          role,
        }),
      },
      request: {
        validateUsing: async () => ({
          name: "E",
          startDate: "2026-06-13",
          endDate: "2026-06-14",
        }),
      },
      response: {
        created: () => (record.status = 201),
        forbidden: () => (record.status = 403),
        unprocessableEntity: () => (record.status = 422),
        conflict: () => (record.status = 409),
      },
    } as unknown as Parameters<CreateEventController["handle"]>[0];
  }

  test("passes staff status from the site role and maps errors", async ({
    assert,
  }) => {
    const seen: boolean[] = [];
    const service = {
      execute: async (
        _orgId: string,
        _input: unknown,
        _actorId: string,
        actor: { isStaff: boolean }
      ) => {
        seen.push(actor.isStaff);
        throw actor.isStaff
          ? new EventTierRequiredError()
          : new EventTierForbiddenError();
      },
    } as unknown as CreateEventService;

    const staff = { status: null as number | null };
    await new CreateEventController().handle(ctxFor("admin", staff), service);
    const organizer = { status: null as number | null };
    await new CreateEventController().handle(
      ctxFor("user", organizer),
      service
    );

    assert.deepEqual(seen, [true, false]);
    assert.equal(staff.status, 422);
    assert.equal(organizer.status, 403);
  });
});

test.group("OrgAdminMiddleware mock", () => {
  test("rejects role=member with 403", async ({ assert }) => {
    let forbiddenCalled = false;
    let forbiddenBody: any = null;

    const ctx: any = {
      orgMembership: { role: "member" },
      response: {
        forbidden: (body: any) => {
          forbiddenCalled = true;
          forbiddenBody = body;
        },
      },
    };

    let nextCalled = false;
    await new OrgAdminMiddleware().handle(ctx, async () => {
      nextCalled = true;
    });

    assert.isFalse(nextCalled);
    assert.isTrue(forbiddenCalled);
    assert.match(forbiddenBody.message, /admin/i);
  });

  test("calls next for role=admin", async ({ assert }) => {
    const ctx: any = {
      orgMembership: { role: "admin" },
      response: {
        forbidden: () => {},
      },
    };

    let nextCalled = false;
    await new OrgAdminMiddleware().handle(ctx, async () => {
      nextCalled = true;
    });

    assert.isTrue(nextCalled);
  });
});
