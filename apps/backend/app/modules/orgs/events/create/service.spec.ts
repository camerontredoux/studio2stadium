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
  EventTierPurchaseRequiredError,
  EventTierRequiredError,
} from "#shared/org/event-tier-authority";
import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { resolveCapabilities } from "#shared/org/entitlement";

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

  test("the Enterprise column default is unchanged", async ({ assert }) => {
    assert.equal(orgEvents.eventTier.default, "enterprise");
  });
});

test.group(
  "CreateEventService organizer-created Event Tier (#112)",
  (group) => {
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

    // `event_tier_purchases.buyer_id` is ON DELETE RESTRICT, so rows left
    // behind here would break the blanket `delete(users)` other suites run.
    group.each.teardown(async () => {
      await db.delete(eventTierPurchases).execute();
    });

    async function summitId() {
      const [summit] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, "summit"));
      return summit!.id;
    }

    async function existingEvent(
      orgId: string,
      eventTier: "core" | "regional" | "national" | "enterprise"
    ) {
      const [ev] = await db
        .insert(orgEvents)
        .values({
          orgId,
          name: `Existing ${eventTier}`,
          startDate: "2026-05-01",
          endDate: "2026-05-02",
          eventTier,
        })
        .returning();
      return ev!;
    }

    /** What provisioning leaves behind: a bought event and a self-serve Org. */
    async function purchasedEvent(orgId: string, buyerId: string) {
      const bought = await existingEvent(orgId, "core");
      await db.insert(eventTierPurchases).values({
        reference: `cs_test_${Date.now()}_${Math.random()}`,
        buyerId,
        eventId: bought.id,
        eventTier: "core",
      });
      await db
        .update(organizations)
        .set({ selfServe: true })
        .where(eq(organizations.id, orgId));
      return bought;
    }

    const details = {
      name: "Organizer Event",
      startDate: "2026-09-01",
      endDate: "2026-09-02",
    };

    test("an Organizer of a self-serve Org cannot create an event for free", async ({
      assert,
    }) => {
      const organizer = await makeActorUser();
      const orgId = await summitId();
      const bought = await purchasedEvent(orgId, organizer.id);

      await assert.rejects(
        () => svc.execute(orgId, details, organizer.id, { isStaff: false }),
        EventTierPurchaseRequiredError
      );
      const events = await db
        .select()
        .from(orgEvents)
        .where(eq(orgEvents.orgId, orgId));
      assert.deepEqual(
        events.map((e) => e.id),
        [bought.id]
      );
    });

    test("staff can still add an event to a self-serve Org", async ({
      assert,
    }) => {
      const staff = await makeActorUser();
      const orgId = await summitId();
      await purchasedEvent(orgId, staff.id);

      const ev = await svc.execute(
        orgId,
        { ...details, eventTier: "national" },
        staff.id,
        { isStaff: true }
      );
      assert.equal(ev.eventTier, "national");
    });

    test("a self-serve Org stays self-serve after its bought event is gone", async ({
      assert,
    }) => {
      const organizer = await makeActorUser();
      const orgId = await summitId();
      const bought = await purchasedEvent(orgId, organizer.id);

      // The database refuses to delete a bought event while its sale stands,
      // but should the purchase row and the event ever both go — a hand edit
      // in the database — the Org must not fall back to grandfathered and
      // hand out free Enterprise events.
      await db
        .delete(eventTierPurchases)
        .where(eq(eventTierPurchases.eventId, bought.id));
      await db.delete(orgEvents).where(eq(orgEvents.id, bought.id));
      assert.lengthOf(await db.select().from(eventTierPurchases), 0);

      await assert.rejects(
        () => svc.execute(orgId, details, organizer.id, { isStaff: false }),
        EventTierPurchaseRequiredError
      );
      assert.lengthOf(
        await db.select().from(orgEvents).where(eq(orgEvents.orgId, orgId)),
        0
      );
    });

    test("an Organizer of a grandfathered Org still creates events at Enterprise", async ({
      assert,
    }) => {
      const organizer = await makeActorUser();
      const orgId = await summitId();
      await existingEvent(orgId, "enterprise");

      const ev = await svc.execute(orgId, details, organizer.id);
      assert.equal(ev.eventTier, "enterprise");
    });

    test("an Organizer's first event in a grandfathered Org is Enterprise, as today", async ({
      assert,
    }) => {
      const organizer = await makeActorUser();
      const ev = await svc.execute(await summitId(), details, organizer.id);
      assert.equal(ev.eventTier, "enterprise");
    });

    test("a new event in a grandfathered Org keeps the overrides its Org's events carry", async ({
      assert,
    }) => {
      // Overrides were org-wide before #109, so a new event took the Org's.
      const organizer = await makeActorUser();
      const orgId = await summitId();
      const earlier = await existingEvent(orgId, "enterprise");
      await db
        .update(orgEvents)
        .set({ capabilityOverrides: { check_in: false, callbacks: true } })
        .where(eq(orgEvents.id, earlier.id));

      const ev = await svc.execute(orgId, details, organizer.id);
      assert.deepEqual(ev.capabilityOverrides, {
        check_in: false,
        callbacks: true,
      });
      assert.sameMembers(resolveCapabilities(ev), [
        "callbacks",
        "school_selections",
        "video_library",
      ]);
    });

    test("a grandfathered Org's first event starts from the flags still on the Org", async ({
      assert,
    }) => {
      // An Org with no event when overrides moved kept its flags (#109): they
      // would have applied to its first event, so they still do.
      const organizer = await makeActorUser();
      const ev = await svc.execute(await summitId(), details, organizer.id);
      assert.deepEqual(ev.capabilityOverrides, {
        callbacks: true,
        school_selections: true,
        video_library: true,
      });
    });

    test("an event staff add to a self-serve Org starts with no overrides", async ({
      assert,
    }) => {
      const staff = await makeActorUser();
      const orgId = await summitId();
      const bought = await purchasedEvent(orgId, staff.id);
      await db
        .update(orgEvents)
        .set({ capabilityOverrides: { callbacks: true } })
        .where(eq(orgEvents.id, bought.id));

      const ev = await svc.execute(
        orgId,
        { ...details, eventTier: "regional" },
        staff.id,
        { isStaff: true }
      );
      assert.deepEqual(ev.capabilityOverrides, {});
    });
  }
);

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

  test("an Organizer of a self-serve Org gets a 403", async ({ assert }) => {
    const service = {
      execute: async () => {
        throw new EventTierPurchaseRequiredError();
      },
    } as unknown as CreateEventService;

    const organizer = { status: null as number | null };
    await new CreateEventController().handle(
      ctxFor("user", organizer),
      service
    );
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
