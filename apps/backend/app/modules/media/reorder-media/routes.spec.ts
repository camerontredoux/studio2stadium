import { db } from "#database/connection";
import { dancerProfiles } from "#database/schema/dancers";
import { images, videos } from "#database/schema/media";
import { platforms, users } from "#database/schema/users";
import { normalizeEmail } from "#utils/normalize-email";
import cache from "@adonisjs/cache/services/main";
import hash from "@adonisjs/core/services/hash";
import { faker } from "@faker-js/faker";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";

const PASSWORD = "reorder-media-test-password";

// A dancer with two images and a video.
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
  await db
    .insert(dancerProfiles)
    .values({ userId: user.id, birthday: "2008-01-01", location: "CA" });
  const imageRows = await db
    .insert(images)
    .values(
      [0, 1].map(() => ({
        userId: user.id,
        mediaUrl: `images/${faker.string.uuid()}.jpg`,
      }))
    )
    .returning();
  const [video] = await db
    .insert(videos)
    .values({ userId: user.id, mediaId: faker.string.uuid(), type: "youtube" })
    .returning();
  return { user, imageIds: imageRows.map((row) => row.id), videoId: video.id };
}

async function bearerToken(client: ApiClient, email: string) {
  const response = await client
    .post("/auth/login")
    .header("X-Client-Type", "mobile")
    .json({ email, password: PASSWORD });
  response.assertStatus(200);
  return (response.body() as { token: string }).token;
}

async function positions(client: ApiClient, token: string, username: string) {
  const response = await client
    .get(`/dancers/${username}`)
    .header("Authorization", `Bearer ${token}`);
  response.assertStatus(200);
  const body = response.body() as {
    images: { id: string; position: number | null }[];
    videos: { id: string; position: number | null }[];
  };
  return Object.fromEntries(
    [...body.images, ...body.videos].map((row) => [row.id, row.position])
  );
}

test.group("Media / reorder media", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    await cache.clear();
  });

  test("one order runs across images and videos", async ({
    client,
    assert,
  }) => {
    const { user, imageIds, videoId } = await createDancer();
    const token = await bearerToken(client, user.email);

    const response = await client
      .put("/media/order")
      .header("Authorization", `Bearer ${token}`)
      .json({
        items: [
          { type: "image", id: imageIds[1] },
          { type: "video", id: videoId },
          { type: "image", id: imageIds[0] },
        ],
      });

    response.assertStatus(204);
    assert.deepEqual(await positions(client, token, user.username), {
      [imageIds[1]]: 0,
      [videoId]: 1,
      [imageIds[0]]: 2,
    });
  });

  test("media never reordered has no position", async ({ client, assert }) => {
    const { user, imageIds, videoId } = await createDancer();
    const token = await bearerToken(client, user.email);

    assert.deepEqual(await positions(client, token, user.username), {
      [imageIds[0]]: null,
      [imageIds[1]]: null,
      [videoId]: null,
    });
  });

  test("an id under the wrong type is refused", async ({ client }) => {
    const { user, imageIds, videoId } = await createDancer();
    const token = await bearerToken(client, user.email);

    const response = await client
      .put("/media/order")
      .header("Authorization", `Bearer ${token}`)
      .json({
        items: [
          { type: "image", id: imageIds[0] },
          { type: "image", id: imageIds[1] },
          { type: "image", id: videoId },
        ],
      });

    response.assertStatus(400);
  });

  test("another user's media cannot be ordered", async ({ client }) => {
    const owner = await createDancer();
    const other = await createDancer();
    const token = await bearerToken(client, other.user.email);

    const response = await client
      .put("/media/order")
      .header("Authorization", `Bearer ${token}`)
      .json({
        items: [
          { type: "image", id: owner.imageIds[0] },
          { type: "image", id: owner.imageIds[1] },
          { type: "video", id: owner.videoId },
        ],
      });

    response.assertStatus(400);
  });
});
