import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { organizations, orgMemberships } from "#database/schema/organizations";
import {
  orgEvents,
  eventRosters,
  eventDancerProfiles,
} from "#database/schema/org-events";
import { seedOrganizations } from "#commands/backfill-organizations";
import { eq } from "drizzle-orm";
import { ListDancersService } from "./service.ts";

test.group("ListDancersService", (group) => {
  let summit: typeof organizations.$inferSelect;
  let event: typeof orgEvents.$inferSelect;

  group.each.setup(async () => {
    await db.delete(eventDancerProfiles).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();
    [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    const [ev] = await db
      .insert(orgEvents)
      .values({
        orgId: summit.id,
        name: "Summit 2026",
        startDate: "2026-06-13",
        endDate: "2026-06-14",
        isActive: true,
      })
      .returning();
    event = ev!;
  });

  test("returns all dancers when no filter", async ({ assert }) => {
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "alice@x.co",
        firstName: "Alice",
        lastName: "Smith",
        bibNumber: 101,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        bibNumber: 102,
      },
      {
        eventId: event.id,
        type: "coach",
        email: "coach@x.co",
        firstName: "Coach",
        lastName: "Person",
      },
    ]);

    const svc = new ListDancersService();
    const rows = await svc.execute(summit.id, event.id, null, {});
    assert.equal(rows.length, 2);
    assert.isTrue(rows.every((r) => r.bibNumber !== null));
  });

  test("filters by search on firstName", async ({ assert }) => {
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "alice@x.co",
        firstName: "Alice",
        lastName: "Smith",
        bibNumber: 101,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        bibNumber: 102,
      },
    ]);

    const svc = new ListDancersService();
    const rows = await svc.execute(summit.id, event.id, null, {
      search: "alice",
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.firstName, "Alice");
  });

  test("filters by search on lastName", async ({ assert }) => {
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "alice@x.co",
        firstName: "Alice",
        lastName: "Smith",
        bibNumber: 101,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        bibNumber: 102,
      },
    ]);

    const svc = new ListDancersService();
    const rows = await svc.execute(summit.id, event.id, null, {
      search: "jones",
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.lastName, "Jones");
  });

  test("filters by exact bib number", async ({ assert }) => {
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "alice@x.co",
        firstName: "Alice",
        lastName: "Smith",
        bibNumber: 101,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        bibNumber: 102,
      },
    ]);

    const svc = new ListDancersService();
    const rows = await svc.execute(summit.id, event.id, null, { bib: 101 });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.bibNumber, 101);
  });

  test("returns isRegistered on rows", async ({ assert }) => {
    const [aliceUser] = await db
      .insert(users)
      .values({
        username: "alice",
        email: "alice@x.co",
        displayEmail: "alice@x.co",
        firstName: "Alice",
        lastName: "Smith",
        password: "x",
        role: "user",
        type: "dancer",
        verified: true,
      })
      .returning();

    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "alice@x.co",
        firstName: "Alice",
        lastName: "Smith",
        bibNumber: 101,
        userId: aliceUser!.id,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        bibNumber: 102,
      },
    ]);

    const svc = new ListDancersService();
    const rows = await svc.execute(summit.id, event.id, null, {});
    const alice = rows.find((r) => r.firstName === "Alice");
    const bob = rows.find((r) => r.firstName === "Bob");
    assert.isTrue(alice!.isRegistered);
    assert.isFalse(bob!.isRegistered);
  });

  test("works when no eventDancerProfiles row exists (leftJoin nulls)", async ({
    assert,
  }) => {
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "ghost@x.co",
        firstName: "Ghost",
        lastName: "Dancer",
        bibNumber: 201,
      },
    ]);

    const svc = new ListDancersService();
    const rows = await svc.execute(summit.id, event.id, null, {});
    assert.equal(rows.length, 1);
    assert.isNull(rows[0]!.profilePhotoUrl);
    assert.isNull(rows[0]!.studio);
  });

  test("returns eventDancerProfiles fields when profile exists", async ({
    assert,
  }) => {
    const [roster] = await db
      .insert(eventRosters)
      .values([
        {
          eventId: event.id,
          type: "dancer",
          email: "pro@x.co",
          firstName: "Pro",
          lastName: "Dancer",
          bibNumber: 301,
        },
      ])
      .returning();

    await db.insert(eventDancerProfiles).values({
      rosterId: roster!.id,
      profilePhotoUrl: "https://cdn.example.com/photo.jpg",
      studio: "Elite Dance",
      state: "CA",
      gradYear: 2025,
      gpa: 3.8,
    });

    const svc = new ListDancersService();
    const rows = await svc.execute(summit.id, event.id, null, {});
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.profilePhotoUrl, "https://cdn.example.com/photo.jpg");
    assert.equal(rows[0]!.studio, "Elite Dance");
    assert.equal(rows[0]!.state, "CA");
  });

  test("spans all of the org's events when allEvents is set", async ({
    assert,
  }) => {
    const [pastEvent] = await db
      .insert(orgEvents)
      .values({
        orgId: summit.id,
        name: "Summit 2025",
        startDate: "2025-06-13",
        endDate: "2025-06-14",
        isActive: false,
      })
      .returning();

    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "current@x.co",
        firstName: "Current",
        lastName: "Dancer",
        bibNumber: 101,
      },
      {
        eventId: pastEvent!.id,
        type: "dancer",
        email: "past@x.co",
        firstName: "Past",
        lastName: "Dancer",
        bibNumber: 201,
      },
    ]);

    const svc = new ListDancersService();

    const activeOnly = await svc.execute(summit.id, event.id, null, {});
    assert.equal(activeOnly.length, 1);
    assert.equal(activeOnly[0]!.firstName, "Current");

    const all = await svc.execute(
      summit.id,
      event.id,
      null,
      {},
      false,
      undefined,
      true
    );
    assert.equal(all.length, 2);
  });

  test("dedupes a registered dancer across events, preferring the active event", async ({
    assert,
  }) => {
    const [dana] = await db
      .insert(users)
      .values({
        username: "dana",
        email: "dana@x.co",
        displayEmail: "dana@x.co",
        firstName: "Dana",
        lastName: "Lee",
        password: "x",
        role: "user",
        type: "dancer",
        verified: true,
      })
      .returning();

    const [pastEvent] = await db
      .insert(orgEvents)
      .values({
        orgId: summit.id,
        name: "Summit 2025",
        startDate: "2025-06-13",
        endDate: "2025-06-14",
        isActive: false,
      })
      .returning();

    await db.insert(eventRosters).values({
      eventId: pastEvent!.id,
      type: "dancer",
      email: "dana@x.co",
      firstName: "Dana",
      lastName: "Lee",
      bibNumber: 55,
      userId: dana!.id,
    });
    const [activeRoster] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        type: "dancer",
        email: "dana@x.co",
        firstName: "Dana",
        lastName: "Lee",
        bibNumber: 66,
        userId: dana!.id,
      })
      .returning();

    const svc = new ListDancersService();
    const all = await svc.execute(
      summit.id,
      event.id,
      null,
      {},
      false,
      undefined,
      true
    );
    assert.equal(all.length, 1);
    assert.equal(all[0]!.rosterId, activeRoster!.id);
  });
});
