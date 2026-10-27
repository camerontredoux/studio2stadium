import { test } from "@japa/runner";
import { db } from "#database/connection";
import { getUserSession } from "#auth/queries";
import {
  eventCallbacks,
  eventShowcases,
  publishedCallbacks,
} from "#database/schema/event-features";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import redis from "@adonisjs/redis/services/main";
import { MessageBuilder } from "@adonisjs/core/helpers";
import { randomUUID } from "node:crypto";

function dateFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function createUser(
  username: string,
  type: "school" | "dancer" = "school"
) {
  const email = `${username}@example.com`;
  const [user] = await db
    .insert(users)
    .values({
      username,
      email,
      displayEmail: email,
      firstName: username,
      lastName: "Test",
      password: "hashed",
      role: "user",
      type,
      verified: true,
    })
    .returning();
  return user!;
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

/** An org with callbacks on, its active event, and a coach and a dancer on it. */
async function setup(features: Record<string, boolean> = { callbacks: true }) {
  const [org] = await db
    .insert(organizations)
    .values({ name: "History Org", slug: "history-org", features })
    .returning();
  const [event] = await db
    .insert(orgEvents)
    .values({
      orgId: org!.id,
      name: "Active Event",
      startDate: dateFromToday(-1),
      endDate: dateFromToday(1),
      isActive: true,
    })
    .returning();
  const coachUser = await createUser("history_coach");
  const dancerUser = await createUser("history_dancer", "dancer");
  await db.insert(orgMemberships).values([
    { orgId: org!.id, userId: coachUser.id, role: "member", type: "coach" },
    { orgId: org!.id, userId: dancerUser.id, role: "member", type: "dancer" },
  ]);
  const [coach, dancer] = await db
    .insert(eventRosters)
    .values([
      {
        eventId: event!.id,
        userId: coachUser.id,
        type: "coach",
        email: coachUser.email,
        firstName: "History",
        lastName: "Coach",
      },
      {
        eventId: event!.id,
        userId: dancerUser.id,
        type: "dancer",
        email: dancerUser.email,
        firstName: "Juna",
        lastName: "Park",
        bibNumber: 230,
      },
    ])
    .returning();
  return {
    org: org!,
    event: event!,
    coach: coach!,
    dancer: dancer!,
    coachUser,
    dancerUser,
  };
}

test.group("GET /orgs/:slug/callbacks/history", (group) => {
  group.each.setup(async () => {
    await db.delete(publishedCallbacks).execute();
    await db.delete(eventCallbacks).execute();
    await db.delete(eventShowcases).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
  });

  test("a coach reads their callbacks grouped by showcase", async ({
    client,
    assert,
  }) => {
    const { org, event, coach, dancer, coachUser } = await setup();
    const [past, current] = await db
      .insert(eventShowcases)
      .values([
        {
          eventId: event.id,
          number: 1,
          status: "published",
          publishedAt: new Date(),
        },
        { eventId: event.id, number: 2, status: "active" },
      ])
      .returning();
    await db.insert(publishedCallbacks).values({
      showcaseId: past!.id,
      coachRosterId: coach.id,
      dancerRosterId: dancer.id,
      rank: 1,
    });

    const response = await client
      .get(`/orgs/${org.slug}/callbacks/history`)
      .header("Authorization", `Bearer ${await loginUser(coachUser.id)}`);

    response.assertStatus(200);
    const { showcases } = response.body();
    assert.deepEqual(
      showcases.map((s: { id: string; isCurrent: boolean }) => [
        s.id,
        s.isCurrent,
      ]),
      [
        [current!.id, true],
        [past!.id, false],
      ]
    );
    assert.deepEqual(
      showcases[1].callbacks.map((c: { bibNumber: number }) => c.bibNumber),
      [230]
    );
  });

  test("a dancer is turned away", async ({ client }) => {
    const { org, dancerUser } = await setup();

    const response = await client
      .get(`/orgs/${org.slug}/callbacks/history`)
      .header("Authorization", `Bearer ${await loginUser(dancerUser.id)}`);

    response.assertStatus(403);
  });

  test("an org without callbacks hides the route from the coach", async ({
    client,
  }) => {
    const { org, coachUser } = await setup({});

    const response = await client
      .get(`/orgs/${org.slug}/callbacks/history`)
      .header("Authorization", `Bearer ${await loginUser(coachUser.id)}`);

    response.assertStatus(404);
  });
});
