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
        isRegistered: true,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        bibNumber: 102,
        isRegistered: false,
      },
      {
        eventId: event.id,
        type: "coach",
        email: "coach@x.co",
        firstName: "Coach",
        lastName: "Person",
        isRegistered: false,
      },
    ]);

    const svc = new ListDancersService();
    const rows = await svc.execute(event.id, {});
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
        isRegistered: true,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        bibNumber: 102,
        isRegistered: false,
      },
    ]);

    const svc = new ListDancersService();
    const rows = await svc.execute(event.id, { search: "alice" });
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
        isRegistered: true,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        bibNumber: 102,
        isRegistered: false,
      },
    ]);

    const svc = new ListDancersService();
    const rows = await svc.execute(event.id, { search: "jones" });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.lastName, "Jones");
  });

  test("filters by search on organization", async ({ assert }) => {
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "alice@x.co",
        firstName: "Alice",
        lastName: "Smith",
        organization: "Acme Dance",
        bibNumber: 101,
        isRegistered: true,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        organization: "Beta Studio",
        bibNumber: 102,
        isRegistered: false,
      },
    ]);

    const svc = new ListDancersService();
    const rows = await svc.execute(event.id, { search: "acme" });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.organization, "Acme Dance");
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
        isRegistered: true,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        bibNumber: 102,
        isRegistered: false,
      },
    ]);

    const svc = new ListDancersService();
    const rows = await svc.execute(event.id, { bib: 101 });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.bibNumber, 101);
  });

  test("returns isRegistered on rows", async ({ assert }) => {
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "alice@x.co",
        firstName: "Alice",
        lastName: "Smith",
        bibNumber: 101,
        isRegistered: true,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        bibNumber: 102,
        isRegistered: false,
      },
    ]);

    const svc = new ListDancersService();
    const rows = await svc.execute(event.id, {});
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
        isRegistered: false,
      },
    ]);

    const svc = new ListDancersService();
    const rows = await svc.execute(event.id, {});
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
          isRegistered: true,
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
    const rows = await svc.execute(event.id, {});
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.profilePhotoUrl, "https://cdn.example.com/photo.jpg");
    assert.equal(rows[0]!.studio, "Elite Dance");
    assert.equal(rows[0]!.state, "CA");
  });

  test("respects limit and offset", async ({ assert }) => {
    const dancers = Array.from({ length: 5 }, (_, i) => ({
      eventId: event.id,
      type: "dancer" as const,
      email: `d${i}@x.co`,
      firstName: `Dancer${i}`,
      lastName: "Test",
      bibNumber: 100 + i,
      isRegistered: false,
    }));
    await db.insert(eventRosters).values(dancers);

    const svc = new ListDancersService();
    const page1 = await svc.execute(event.id, { limit: 2, offset: 0 });
    const page2 = await svc.execute(event.id, { limit: 2, offset: 2 });
    assert.equal(page1.length, 2);
    assert.equal(page2.length, 2);
    assert.notDeepEqual(page1[0], page2[0]);
  });
});
