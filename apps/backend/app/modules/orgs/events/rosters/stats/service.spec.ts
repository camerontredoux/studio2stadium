import { test } from "@japa/runner";
import { db } from "#database/connection";
import {
  eventDancerProfiles,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { StatsRosterService } from "./service.ts";

async function makeOrgAndEvent() {
  const [org] = await db
    .insert(organizations)
    .values({ name: "T", slug: `t-${Date.now()}-${Math.random()}` })
    .returning();
  const [event] = await db
    .insert(orgEvents)
    .values({
      orgId: org!.id,
      name: "E",
      startDate: "2026-06-01",
      endDate: "2026-06-02",
    })
    .returning();
  return { org: org!, event: event! };
}

async function makeUser(suffix: string) {
  const [user] = await db
    .insert(users)
    .values({
      username: `user-${suffix}`,
      email: `${suffix}@example.com`,
      role: "user",
      type: "dancer",
      displayEmail: `${suffix}@example.com`,
      firstName: "Test",
      lastName: "User",
      password: "hashed-password",
    })
    .returning();
  return user!;
}

test.group("StatsRosterService", (group) => {
  group.each.setup(async () => {
    await db.delete(eventDancerProfiles).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(organizations).execute();
    await db.delete(users).execute();
  });

  test("returns zeros when the event has no rosters", async ({ assert }) => {
    const { event } = await makeOrgAndEvent();
    const service = new StatsRosterService();
    const result = await service.execute(event.id, { type: "dancer" });
    assert.deepEqual(result, { total: 0, active: 0, pending: 0 });
  });

  test("counts active and pending dancers correctly", async ({ assert }) => {
    const { event } = await makeOrgAndEvent();
    const u1 = await makeUser("u1");
    const u2 = await makeUser("u2");

    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "alice@example.com",
        firstName: "Alice",
        lastName: "Active",
        userId: u1.id,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@example.com",
        firstName: "Bob",
        lastName: "Active",
        userId: u2.id,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "cora@example.com",
        firstName: "Cora",
        lastName: "Pending",
        userId: null,
      },
    ]);

    const service = new StatsRosterService();
    const result = await service.execute(event.id, { type: "dancer" });
    assert.deepEqual(result, { total: 3, active: 2, pending: 1 });
  });

  test("does not count rosters of the wrong type", async ({ assert }) => {
    const { event } = await makeOrgAndEvent();

    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "d1@example.com",
        firstName: "D",
        lastName: "One",
        userId: null,
      },
      {
        eventId: event.id,
        type: "coach",
        email: "c1@example.com",
        firstName: "C",
        lastName: "One",
        userId: null,
      },
      {
        eventId: event.id,
        type: "coach",
        email: "c2@example.com",
        firstName: "C",
        lastName: "Two",
        userId: null,
      },
    ]);

    const service = new StatsRosterService();
    const dancerResult = await service.execute(event.id, { type: "dancer" });
    const coachResult = await service.execute(event.id, { type: "coach" });

    assert.deepEqual(dancerResult, { total: 1, active: 0, pending: 1 });
    assert.deepEqual(coachResult, { total: 2, active: 0, pending: 2 });
  });

  test("does not count rosters from a different event", async ({ assert }) => {
    const { org, event: eventA } = await makeOrgAndEvent();
    const [eventB] = await db
      .insert(orgEvents)
      .values({
        orgId: org.id,
        name: "Other",
        startDate: "2026-06-03",
        endDate: "2026-06-04",
      })
      .returning();

    await db.insert(eventRosters).values([
      {
        eventId: eventA.id,
        type: "dancer",
        email: "a1@example.com",
        firstName: "A",
        lastName: "One",
        userId: null,
      },
      {
        eventId: eventB!.id,
        type: "dancer",
        email: "b1@example.com",
        firstName: "B",
        lastName: "One",
        userId: null,
      },
      {
        eventId: eventB!.id,
        type: "dancer",
        email: "b2@example.com",
        firstName: "B",
        lastName: "Two",
        userId: null,
      },
    ]);

    const service = new StatsRosterService();
    const result = await service.execute(eventA.id, { type: "dancer" });
    assert.deepEqual(result, { total: 1, active: 0, pending: 1 });
  });
});
