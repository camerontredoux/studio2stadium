import { db } from "#database/connection";
import { references, dancerProfiles } from "#database/schema/dancers";
import { platforms, users } from "#database/schema/users";
import { normalizeEmail } from "#utils/normalize-email";
import cache from "@adonisjs/cache/services/main";
import hash from "@adonisjs/core/services/hash";
import { faker } from "@faker-js/faker";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";

const PASSWORD = "reorder-references-test-password";

// A dancer with three references created a second apart, oldest first.
async function createDancer() {
  const displayEmail = faker.internet.email().toLowerCase();
  const [user] = await db
    .insert(users)
    .values({
      username: faker.internet.username().toLowerCase(),
      email: await normalizeEmail(displayEmail),
      displayEmail,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: await hash.make(PASSWORD),
      role: "user",
      type: "dancer",
      verified: true,
    })
    .returning();
  await db.insert(platforms).values({ userId: user.id, platformName: "core" });
  const [profile] = await db
    .insert(dancerProfiles)
    .values({ userId: user.id, birthday: "2008-01-01", location: "CA" })
    .returning();
  const rows = await db
    .insert(references)
    .values(
      [0, 1, 2].map((i) => ({
        ...{
          profileId: profile.id,
          name: `Ref ${i}`,
          title: "Coach",
          description: "d",
        },
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)),
      }))
    )
    .returning();
  return { user, ids: rows.map((row) => row.id) };
}

async function bearerToken(client: ApiClient, email: string) {
  const response = await client
    .post("/auth/login")
    .header("X-Client-Type", "mobile")
    .json({ email, password: PASSWORD });
  response.assertStatus(200);
  return (response.body() as { token: string }).token;
}

async function shownIds(client: ApiClient, token: string, username: string) {
  const response = await client
    .get(`/dancers/${username}`)
    .header("Authorization", `Bearer ${token}`);
  response.assertStatus(200);
  return (response.body().references as { id: string }[]).map((row) => row.id);
}

test.group("Dancers / reorder references", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    await cache.clear();
  });

  test("references never reordered show oldest first", async ({
    client,
    assert,
  }) => {
    const { user, ids } = await createDancer();
    const token = await bearerToken(client, user.email);

    assert.deepEqual(await shownIds(client, token, user.username), ids);
  });

  test("a saved order is what the profile shows", async ({
    client,
    assert,
  }) => {
    const { user, ids } = await createDancer();
    const token = await bearerToken(client, user.email);
    const order = [ids[2], ids[0], ids[1]];

    const response = await client
      .put("/dancers/references/order")
      .header("Authorization", `Bearer ${token}`)
      .json({ ids: order });

    response.assertStatus(204);
    assert.deepEqual(await shownIds(client, token, user.username), order);
  });

  test("an order missing an item is refused and changes nothing", async ({
    client,
    assert,
  }) => {
    const { user, ids } = await createDancer();
    const token = await bearerToken(client, user.email);

    const response = await client
      .put("/dancers/references/order")
      .header("Authorization", `Bearer ${token}`)
      .json({ ids: [ids[2], ids[0]] });

    response.assertStatus(400);
    assert.deepEqual(await shownIds(client, token, user.username), ids);
  });

  test("another dancer's references cannot be ordered", async ({
    client,
    assert,
  }) => {
    const owner = await createDancer();
    const other = await createDancer();
    const token = await bearerToken(client, other.user.email);

    const response = await client
      .put("/dancers/references/order")
      .header("Authorization", `Bearer ${token}`)
      .json({ ids: owner.ids });

    response.assertStatus(400);
    const ownerToken = await bearerToken(client, owner.user.email);
    assert.deepEqual(
      await shownIds(client, ownerToken, owner.user.username),
      owner.ids
    );
  });
});
