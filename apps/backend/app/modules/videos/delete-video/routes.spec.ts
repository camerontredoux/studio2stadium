import { db } from "#database/connection";
import { dancerProfiles } from "#database/schema/dancers";
import { feed } from "#database/schema/feed";
import { videoUploads, videos } from "#database/schema/media";
import { users } from "#database/schema/users";
import { normalizeEmail } from "#utils/normalize-email";
import hash from "@adonisjs/core/services/hash";
import { faker } from "@faker-js/faker";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { eq } from "drizzle-orm";

const PASSWORD = "delete-video-test-password";
const originalFetch = globalThis.fetch;

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
  await db.insert(dancerProfiles).values({
    userId: user.id,
    birthday: "2008-01-01",
    location: "CA",
  });
  return user;
}

async function bearerToken(client: ApiClient, email: string) {
  const response = await client
    .post("/auth/login")
    .header("X-Client-Type", "mobile")
    .json({ email, password: PASSWORD });
  response.assertStatus(200);
  return (response.body() as { token: string }).token;
}

async function createVideo(userId: string, type: "cloudflare" | "youtube") {
  const [video] = await db
    .insert(videos)
    .values({ userId, mediaId: faker.string.uuid(), type })
    .returning();
  await db.insert(feed).values({
    userId,
    contentId: video.id,
    contentType: "video",
  });
  if (type === "cloudflare") {
    await db.insert(videoUploads).values({
      userId,
      cloudflareMediaId: video.mediaId,
      videoId: video.id,
      status: "ready",
    });
  }
  return video;
}

test.group("Videos / delete ownership", (group) => {
  const userIds: string[] = [];
  let requests: { url: string; method: string | undefined }[] = [];

  group.each.setup(() => {
    requests = [];
    globalThis.fetch = async (input, init) => {
      requests.push({ url: String(input), method: init?.method });
      return new Response(null, { status: 204 });
    };
  });

  group.each.teardown(async () => {
    globalThis.fetch = originalFetch;
    for (const id of userIds.splice(0)) {
      await db.delete(users).where(eq(users.id, id));
    }
  });

  test("another profile holder gets the same 404 as a missing id without deleting anything", async ({
    client,
    assert,
  }) => {
    const owner = await createDancer();
    const caller = await createDancer();
    userIds.push(owner.id, caller.id);
    const video = await createVideo(owner.id, "cloudflare");
    const token = await bearerToken(client, caller.email);

    const response = await client
      .delete(`/videos/${video.id}`)
      .header("Authorization", `Bearer ${token}`);
    response.assertStatus(404);
    const missing = await client
      .delete(`/videos/${faker.string.uuid()}`)
      .header("Authorization", `Bearer ${token}`);
    missing.assertStatus(404);
    assert.equal(response.body().message, missing.body().message);
    assert.deepEqual(requests, []);
    assert.exists(await db.query.videos.findFirst({ where: { id: video.id } }));
    assert.exists(
      await db.query.videoUploads.findFirst({ where: { videoId: video.id } })
    );
    assert.exists(
      await db.query.feed.findFirst({ where: { contentId: video.id } })
    );
  });

  for (const type of ["cloudflare", "youtube"] as const) {
    test(`owner can delete their ${type} video and its related rows`, async ({
      client,
      assert,
    }) => {
      const owner = await createDancer();
      userIds.push(owner.id);
      const video = await createVideo(owner.id, type);
      const token = await bearerToken(client, owner.email);

      const response = await client
        .delete(`/videos/${video.id}`)
        .header("Authorization", `Bearer ${token}`);
      response.assertStatus(204);
      assert.notExists(
        await db.query.videos.findFirst({ where: { id: video.id } })
      );
      assert.notExists(
        await db.query.videoUploads.findFirst({
          where: { cloudflareMediaId: video.mediaId },
        })
      );
      assert.notExists(
        await db.query.feed.findFirst({ where: { contentId: video.id } })
      );
      if (type === "cloudflare") {
        assert.lengthOf(requests, 1);
        assert.equal(requests[0].method, "DELETE");
        assert.isTrue(requests[0].url.endsWith(`/stream/${video.mediaId}`));
      } else {
        assert.deepEqual(requests, []);
      }
    });
  }
});
