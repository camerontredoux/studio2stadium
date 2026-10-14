import { db } from "#database/connection";
import { crvVideos } from "#database/schema/crv";
import { dancerProfiles } from "#database/schema/dancers";
import { images, videos } from "#database/schema/media";
import { schoolProfiles } from "#database/schema/schools";
import { platforms, users } from "#database/schema/users";
import { normalizeEmail } from "#utils/normalize-email";
import cache from "@adonisjs/cache/services/main";
import hash from "@adonisjs/core/services/hash";
import { faker } from "@faker-js/faker";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";

const PASSWORD = "get-dancer-test-password";

async function createUser(
  type: "dancer" | "school",
  orgAccountTier?: "limited" | "standard"
) {
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
      type,
      verified: true,
      orgAccountTier,
    })
    .returning();
  return user;
}

// A dancer with a photo, a video, and a CRV video, on the given org tier.
async function createDancer(orgAccountTier?: "limited" | "standard") {
  const user = await createUser("dancer", orgAccountTier);
  await db.insert(platforms).values({ userId: user.id, platformName: "core" });
  const [profile] = await db
    .insert(dancerProfiles)
    .values({ userId: user.id, birthday: "2008-01-01", location: "CA" })
    .returning();
  await db
    .insert(images)
    .values({ userId: user.id, mediaUrl: `images/${faker.string.uuid()}.jpg` });
  await db.insert(videos).values({
    userId: user.id,
    mediaId: faker.string.uuid(),
    type: "cloudflare",
  });
  await db
    .insert(crvVideos)
    .values({ dancerId: profile.id, youtubeId: "dQw4w9WgXcQ" });
  return user;
}

async function createSchool() {
  const user = await createUser("school");
  await db
    .insert(schoolProfiles)
    .values({ userId: user.id, name: faker.company.name(), location: "NY" });
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

async function viewAsSchool(client: ApiClient, username: string) {
  const school = await createSchool();
  const token = await bearerToken(client, school.email);
  const response = await client
    .get(`/dancers/${username}`)
    .header("Authorization", `Bearer ${token}`);
  response.assertStatus(200);
  return response.body();
}

test.group("Dancers / get dancer / tier gates for schools", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    await cache.clear();
  });

  test("a limited dancer's media and CRV video are not sent", async ({
    client,
    assert,
  }) => {
    const dancer = await createDancer("limited");

    const body = await viewAsSchool(client, dancer.username);

    assert.deepEqual(body.images, []);
    assert.deepEqual(body.videos, []);
    assert.isNull(body.submission);
  });

  test("a standard dancer's media is sent but not their CRV video", async ({
    client,
    assert,
  }) => {
    const dancer = await createDancer("standard");

    const body = await viewAsSchool(client, dancer.username);

    assert.lengthOf(body.images, 1);
    assert.lengthOf(body.videos, 1);
    assert.isNull(body.submission);
  });

  test("the dancer still sees their own media and CRV video", async ({
    client,
    assert,
  }) => {
    const dancer = await createDancer("limited");
    const token = await bearerToken(client, dancer.email);

    const response = await client
      .get(`/dancers/${dancer.username}`)
      .header("Authorization", `Bearer ${token}`);

    response.assertStatus(200);
    assert.lengthOf(response.body().images, 1);
    assert.lengthOf(response.body().videos, 1);
    assert.equal(response.body().submission.youtubeId, "dQw4w9WgXcQ");
  });
});

test.group("Dancers / get dancer / cached school view", (group) => {
  const originalFetch = globalThis.fetch;

  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    await cache.clear();
  });

  group.each.teardown(() => {
    globalThis.fetch = originalFetch;
  });

  test("a deleted video leaves the school's view at once", async ({
    client,
    assert,
  }) => {
    const dancer = await createDancer("standard");
    const before = await viewAsSchool(client, dancer.username);
    assert.lengthOf(before.videos, 1);

    // Cloudflare accepts the Stream delete.
    globalThis.fetch = async () => new Response(null, { status: 200 });
    const token = await bearerToken(client, dancer.email);
    const deleted = await client
      .delete(`/videos/${before.videos[0].id}`)
      .header("Authorization", `Bearer ${token}`);
    deleted.assertStatus(204);

    const after = await viewAsSchool(client, dancer.username);
    assert.deepEqual(after.videos, []);
  });
});
