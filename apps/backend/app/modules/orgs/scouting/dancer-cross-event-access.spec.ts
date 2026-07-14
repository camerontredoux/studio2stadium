import { getUserSession } from "#auth/queries";
import { db } from "#database/connection";
import {
  eventShowcases,
  publishedCallbacks,
} from "#database/schema/event-features";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import {
  CheckInNotOpenError,
  CheckInService,
} from "#modules/orgs/events/check-in/service";
import { MessageBuilder } from "@adonisjs/core/helpers";
import redis from "@adonisjs/redis/services/main";
import { test } from "@japa/runner";
import { randomUUID } from "node:crypto";

function dateFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function loginUser(userId: string) {
  const session = await getUserSession(userId);
  if (!session) throw new Error("Test user session was not created");
  const token = randomUUID();
  const version = Date.now();
  const connection = redis.connection("session");
  await connection.setex(`version:${userId}`, 3600, version);
  await connection.setex(
    token,
    3600,
    new MessageBuilder().build({ version, user: session }, undefined, token)
  );
  return token;
}

async function createDancer(username: string) {
  const email = `${username}@example.com`;
  const [dancer] = await db
    .insert(users)
    .values({
      username,
      email,
      displayEmail: email,
      firstName: "Event",
      lastName: "Dancer",
      password: "hashed",
      role: "user",
      type: "dancer",
      verified: true,
    })
    .returning();
  return dancer!;
}

test.group("dancer cross-event access", (group) => {
  group.each.setup(async () => {
    await db.delete(publishedCallbacks).execute();
    await db.delete(eventShowcases).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
  });

  test("a future-event dancer can read dashboard data but cannot check in before the window", async ({
    client,
    assert,
  }) => {
    const [org] = await db
      .insert(organizations)
      .values({
        name: "Dancer Access Org",
        slug: "dancer-access-org",
        features: { callbacks: true, check_in: true },
      })
      .returning();
    const [activeEvent, futureEvent] = await db
      .insert(orgEvents)
      .values([
        {
          orgId: org!.id,
          name: "Active Event",
          startDate: dateFromToday(-1),
          endDate: dateFromToday(1),
          isActive: true,
        },
        {
          orgId: org!.id,
          name: "Future Event",
          startDate: dateFromToday(30),
          endDate: dateFromToday(32),
          startTime: "09:00",
          timezone: "America/Los_Angeles",
        },
      ])
      .returning();
    const dancer = await createDancer(`future_dancer_${Date.now()}`);
    await db.insert(orgMemberships).values({
      orgId: org!.id,
      userId: dancer.id,
      role: "member",
      type: "dancer",
    });
    await db.insert(eventRosters).values({
      eventId: futureEvent!.id,
      userId: dancer.id,
      type: "dancer",
      email: dancer.email,
      firstName: "Future",
      lastName: "Dancer",
    });
    const token = await loginUser(dancer.id);
    const authorization = `Bearer ${token}`;

    const orgResponse = await client
      .get(`/orgs/${org!.slug}`)
      .header("Authorization", authorization);
    orgResponse.assertStatus(200);
    assert.equal(orgResponse.body().myRoster.eventId, futureEvent!.id);
    assert.equal(orgResponse.body().myRosters.length, 1);

    const eventsResponse = await client
      .get(`/orgs/${org!.slug}/events`)
      .header("Authorization", authorization);
    eventsResponse.assertStatus(200);
    assert.includeMembers(
      eventsResponse.body().map((event: { id: string }) => event.id),
      [activeEvent!.id, futureEvent!.id]
    );

    const statusResponse = await client
      .get(`/orgs/${org!.slug}/events/${futureEvent!.id}/check-in/status`)
      .header("Authorization", authorization);
    statusResponse.assertStatus(200);
    assert.isFalse(statusResponse.body().canCheckIn);

    const otherEventStatus = await client
      .get(`/orgs/${org!.slug}/events/${activeEvent!.id}/check-in/status`)
      .header("Authorization", authorization);
    otherEventStatus.assertStatus(403);

    const videoCategoriesResponse = await client
      .get(`/orgs/${org!.slug}/events/${futureEvent!.id}/video-categories`)
      .header("Authorization", authorization);
    videoCategoriesResponse.assertStatus(200);
    assert.deepEqual(videoCategoriesResponse.body(), []);

    const schoolsResponse = await client
      .get(`/orgs/${org!.slug}/schools`)
      .qs({ eventId: futureEvent!.id })
      .header("Authorization", authorization);
    schoolsResponse.assertStatus(200);
    assert.deepEqual(schoolsResponse.body(), []);

    const selectionsResponse = await client
      .get(`/orgs/${org!.slug}/my-selections`)
      .qs({ eventId: futureEvent!.id })
      .header("Authorization", authorization);
    selectionsResponse.assertStatus(200);
    assert.deepEqual(selectionsResponse.body(), []);

    const callbackResponse = await client
      .get(`/orgs/${org!.slug}/dancer/callbacks`)
      .qs({ eventId: futureEvent!.id })
      .header("Authorization", authorization);
    callbackResponse.assertStatus(200);
    assert.deepEqual(callbackResponse.body(), []);

    await assert.rejects(
      () => new CheckInService().execute(futureEvent!.id, dancer.id),
      CheckInNotOpenError.prototype.message
    );

    const strictWriteResponse = await client
      .post(`/orgs/${org!.slug}/events/${futureEvent!.id}/check-in`)
      .header("Authorization", authorization);
    strictWriteResponse.assertStatus(403);
  });

  test("an active-event dancer can still check in inside the window", async ({
    client,
    assert,
  }) => {
    const [org] = await db
      .insert(organizations)
      .values({ name: "Active Dancer Org", slug: "active-dancer-org" })
      .returning();
    const [event] = await db
      .insert(orgEvents)
      .values({
        orgId: org!.id,
        name: "Live Event",
        startDate: dateFromToday(-1),
        endDate: dateFromToday(1),
        startTime: "09:00",
        timezone: "America/Los_Angeles",
        isActive: true,
      })
      .returning();
    const dancer = await createDancer(`active_dancer_${Date.now()}`);
    await db.insert(orgMemberships).values({
      orgId: org!.id,
      userId: dancer.id,
      role: "member",
      type: "dancer",
    });
    await db.insert(eventRosters).values({
      eventId: event!.id,
      userId: dancer.id,
      type: "dancer",
      email: dancer.email,
      firstName: "Active",
      lastName: "Dancer",
    });
    const token = await loginUser(dancer.id);

    const response = await client
      .post(`/orgs/${org!.slug}/events/${event!.id}/check-in`)
      .header("Authorization", `Bearer ${token}`);
    response.assertStatus(200);
    assert.isNotNull(response.body().checkedInAt);
  });
});
