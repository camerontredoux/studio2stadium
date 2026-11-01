import { getUserSession } from "#auth/queries";
import { db } from "#database/connection";
import { orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { MessageBuilder } from "@adonisjs/core/helpers";
import redis from "@adonisjs/redis/services/main";
import { test } from "@japa/runner";
import { inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { selectionFixture, type SelectionFixture } from "../test-fixtures.ts";

async function createDancerUser(orgId: string) {
  const username = `sel_${randomUUID().slice(0, 8)}`;
  const email = `${username}@example.com`;
  const [user] = await db
    .insert(users)
    .values({
      username,
      email,
      displayEmail: email,
      firstName: "Top",
      lastName: "Choice",
      password: "hashed",
      role: "user",
      type: "dancer",
      verified: true,
    })
    .returning();
  await db
    .insert(orgMemberships)
    .values({ orgId, userId: user!.id, role: "member", type: "dancer" });

  const session = await getUserSession(user!.id);
  if (!session) throw new Error("Test user session was not created");
  const token = randomUUID();
  const version = Date.now();
  const connection = redis.connection("session");
  await connection.setex(`version:${user!.id}`, 3600, version);
  await connection.setex(
    token,
    3600,
    new MessageBuilder().build({ version, user: session }, undefined, token)
  );
  return { user: user!, authorization: `Bearer ${token}` };
}

test.group("POST /orgs/:slug/my-selections/:id/move", (group) => {
  let f: SelectionFixture;
  const userIds: string[] = [];

  group.each.setup(async () => {
    f = await selectionFixture();
    return async () => {
      await f.cleanup();
      if (userIds.length)
        await db.delete(users).where(inArray(users.id, userIds));
      userIds.length = 0;
    };
  });

  async function dancerWithChoices(name: string, coachIds: string[]) {
    const { user, authorization } = await createDancerUser(f.org.id);
    userIds.push(user.id);
    const roster = await f.roster(f.event.id, "dancer", name, user.id);
    const rows = await f.select(f.event.id, roster.id, coachIds);
    return { roster, rows, authorization };
  }

  test("moves a choice and returns the new order", async ({
    client,
    assert,
  }) => {
    const [a, b, c] = f.coaches;
    const ada = await dancerWithChoices("Ada", [a!.id, b!.id, c!.id]);

    const response = await client
      .post(`/orgs/${f.org.slug}/my-selections/${ada.rows[1]!.id}/move`)
      .header("Authorization", ada.authorization)
      .json({ direction: "up" });

    response.assertStatus(200);
    assert.deepEqual(
      response
        .body()
        .map((row: { coachRosterId: string; rank: number }) => [
          row.coachRosterId,
          row.rank,
        ]),
      [
        [b!.id, 1],
        [a!.id, 2],
        [c!.id, 3],
      ]
    );
  });

  test("refuses another dancer's choice, an edge move and a bad direction", async ({
    client,
    assert,
  }) => {
    const [a, b] = f.coaches;
    const ada = await dancerWithChoices("Ada", [a!.id, b!.id]);
    const ben = await dancerWithChoices("Ben", [b!.id]);
    const path = `/orgs/${f.org.slug}/my-selections/${ada.rows[0]!.id}/move`;

    const asBen = await client
      .post(path)
      .header("Authorization", ben.authorization)
      .json({ direction: "down" });
    asBen.assertStatus(404);

    const atTop = await client
      .post(path)
      .header("Authorization", ada.authorization)
      .json({ direction: "up" });
    atTop.assertStatus(422);

    const sideways = await client
      .post(path)
      .header("Authorization", ada.authorization)
      .json({ direction: "left" });
    sideways.assertStatus(422);

    assert.deepEqual(await f.ranks(f.event.id, ada.roster.id), [
      [a!.id, 1],
      [b!.id, 2],
    ]);
  });
});
