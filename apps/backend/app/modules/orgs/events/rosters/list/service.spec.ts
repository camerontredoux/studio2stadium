import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import {
  eventDancerProfiles,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { ListRosterService } from "./service.ts";

async function makeOrgAndEvent() {
  const [org] = await db
    .insert(organizations)
    .values({ name: "Test Org", slug: `test-${Date.now()}` })
    .returning();
  const [event] = await db
    .insert(orgEvents)
    .values({
      orgId: org!.id,
      name: "Test Event",
      startDate: "2026-06-01",
      endDate: "2026-06-02",
    })
    .returning();
  return { org: org!, event: event! };
}

test.group("ListRosterService", (group) => {
  group.each.setup(async () => {
    await db.delete(eventDancerProfiles).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
  });

  test("returns paginated dancers with profile data", async ({ assert }) => {
    const { event } = await makeOrgAndEvent();
    const [roster] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        type: "dancer",
        email: "alice@example.com",
        firstName: "Alice",
        lastName: "Anderson",
        bibNumber: 101,
      })
      .returning();
    await db.insert(eventDancerProfiles).values({
      rosterId: roster!.id,
      gradYear: 2027,
      gpa: 3.8,
      studio: "Elite",
      danceStyles: ["Jazz", "Contemporary"],
    });

    const service = new ListRosterService();
    const result = await service.execute(event.id, { type: "dancer" });

    assert.equal(result.total, 1);
    assert.lengthOf(result.data, 1);
    const entry = result.data[0]!;
    assert.equal(entry.firstName, "Alice");
    assert.equal(entry.bibNumber, 101);
    assert.isFalse(entry.isRegistered);
    assert.isNotNull(entry.profile);
    assert.equal(entry.profile!.gradYear, 2027);
    assert.deepEqual(entry.profile!.danceStyles, ["Jazz", "Contemporary"]);
  });

  test("isRegistered derives from userId", async ({ assert }) => {
    const { event } = await makeOrgAndEvent();
    const [user] = await db
      .insert(users)
      .values({
        username: `u_${Date.now()}`,
        email: "registered@example.com",
        displayEmail: "registered@example.com",
        firstName: "Reg",
        lastName: "User",
        password: "hashed",
        role: "user",
        type: "dancer",
      })
      .returning();
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "registered@example.com",
        firstName: "Reg",
        lastName: "User",
        userId: user!.id,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "pending@example.com",
        firstName: "Pen",
        lastName: "Ding",
      },
    ]);

    const service = new ListRosterService();
    const result = await service.execute(event.id, {
      type: "dancer",
      sortBy: "lastName",
      sortDir: "asc",
    });

    const reg = result.data.find((r) => r.email === "registered@example.com");
    const pen = result.data.find((r) => r.email === "pending@example.com");
    assert.isTrue(reg!.isRegistered);
    assert.isFalse(pen!.isRegistered);
  });

  test("search matches firstName, lastName, email, and bibNumber", async ({
    assert,
  }) => {
    const { event } = await makeOrgAndEvent();
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@example.com",
        firstName: "Bob",
        lastName: "Builder",
        bibNumber: 42,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "carol@example.com",
        firstName: "Carol",
        lastName: "Clark",
        bibNumber: 88,
      },
    ]);
    const service = new ListRosterService();

    const byName = await service.execute(event.id, {
      type: "dancer",
      search: "bob",
    });
    assert.equal(byName.total, 1);

    const byBib = await service.execute(event.id, {
      type: "dancer",
      search: "88",
    });
    assert.equal(byBib.total, 1);
    assert.equal(byBib.data[0]!.firstName, "Carol");

    const byEmail = await service.execute(event.id, {
      type: "dancer",
      search: "carol@",
    });
    assert.equal(byEmail.total, 1);
  });

  test("status filter returns only pending or only active", async ({
    assert,
  }) => {
    const { event } = await makeOrgAndEvent();
    const [user] = await db
      .insert(users)
      .values({
        username: `u2_${Date.now()}`,
        email: "active@example.com",
        displayEmail: "active@example.com",
        firstName: "Act",
        lastName: "Ive",
        password: "hashed",
        role: "user",
        type: "dancer",
      })
      .returning();
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "active@example.com",
        firstName: "Act",
        lastName: "Ive",
        userId: user!.id,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "pending@example.com",
        firstName: "Pen",
        lastName: "Ding",
      },
    ]);
    const service = new ListRosterService();

    const pending = await service.execute(event.id, {
      type: "dancer",
      status: "pending",
    });
    assert.equal(pending.total, 1);
    assert.equal(pending.data[0]!.email, "pending@example.com");

    const active = await service.execute(event.id, {
      type: "dancer",
      status: "active",
    });
    assert.equal(active.total, 1);
    assert.equal(active.data[0]!.email, "active@example.com");
  });

  test("coach results have profile: null", async ({ assert }) => {
    const { event } = await makeOrgAndEvent();
    await db.insert(eventRosters).values({
      eventId: event.id,
      type: "coach",
      email: "coach@example.com",
      firstName: "Head",
      lastName: "Coach",
      organization: "Big U",
    });
    const service = new ListRosterService();
    const result = await service.execute(event.id, { type: "coach" });
    assert.equal(result.total, 1);
    assert.isNull(result.data[0]!.profile);
  });

  test("pagination respects limit and offset", async ({ assert }) => {
    const { event } = await makeOrgAndEvent();
    const rows = Array.from({ length: 5 }, (_, i) => ({
      eventId: event.id,
      type: "dancer" as const,
      email: `d${i}@example.com`,
      firstName: "D",
      lastName: `Last${String(i).padStart(2, "0")}`,
    }));
    await db.insert(eventRosters).values(rows);
    const service = new ListRosterService();

    const page0 = await service.execute(event.id, {
      type: "dancer",
      page: 0,
      limit: 2,
    });
    assert.equal(page0.total, 5);
    assert.lengthOf(page0.data, 2);

    const page2 = await service.execute(event.id, {
      type: "dancer",
      page: 2,
      limit: 2,
    });
    assert.equal(page2.total, 5);
    assert.lengthOf(page2.data, 1);
  });
});
