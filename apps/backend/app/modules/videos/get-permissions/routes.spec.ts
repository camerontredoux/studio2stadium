import { db } from "#database/connection";
import { dancerProfiles } from "#database/schema/dancers";
import { videos, videoUploads } from "#database/schema/media";
import { premiumGrants } from "#database/schema/organizations";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { normalizeEmail } from "#utils/normalize-email";
import hash from "@adonisjs/core/services/hash";
import { faker } from "@faker-js/faker";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";

const PASSWORD = "video-permissions-test-password";
const originalFetch = globalThis.fetch;

async function createUser(type: "dancer" | "school") {
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
    })
    .returning();
  return user;
}

async function addCloudflareVideos(userId: string, total: number) {
  await db.insert(videos).values(
    Array.from({ length: total }, () => ({
      userId,
      mediaId: faker.string.uuid(),
      type: "cloudflare" as const,
    }))
  );
}

async function getPermissions(client: ApiClient, email: string) {
  const login = await client
    .post("/auth/login")
    .header("X-Client-Type", "mobile")
    .json({ email, password: PASSWORD });
  login.assertStatus(200);

  const response = await client
    .get("/videos/permissions")
    .header("Authorization", `Bearer ${login.body().token}`);
  response.assertStatus(200);
  return response.body();
}

test.group("Videos / permissions", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  group.each.teardown(() => {
    globalThis.fetch = originalFetch;
  });

  test("a school has no direct upload limit", async ({ client, assert }) => {
    const school = await createUser("school");
    await db.insert(schoolProfiles).values({
      userId: school.id,
      name: faker.company.name(),
      location: "NY",
    });
    await addCloudflareVideos(school.id, 3);

    const body = await getPermissions(client, school.email);

    assert.isNull(body.directVideoLimit);
    assert.isNull(body.directVideosRemaining);
  });

  test("an upload still processing uses one of the dancer's slots", async ({
    client,
    assert,
  }) => {
    const dancer = await createUser("dancer");
    await db
      .insert(dancerProfiles)
      .values({ userId: dancer.id, birthday: "2008-01-01", location: "CA" });
    await db.insert(premiumGrants).values({
      userId: dancer.id,
      sourceType: "org_event",
      expiresAt: faker.date.future(),
    });
    await addCloudflareVideos(dancer.id, 2);
    await db.insert(videoUploads).values({
      userId: dancer.id,
      cloudflareMediaId: faker.string.uuid(),
      status: "processing",
    });
    // Cloudflare has all of the processing upload's bytes.
    globalThis.fetch = async () =>
      Response.json({ result: { status: { state: "inprogress" } } });

    const body = await getPermissions(client, dancer.email);

    assert.equal(body.directVideoLimit, 3);
    assert.equal(body.directVideosRemaining, 0);
  });
});
