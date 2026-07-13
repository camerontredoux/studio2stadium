import { db } from "#database/connection";
import { dancerProfiles } from "#database/schema/dancers";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { organizations, premiumGrants } from "#database/schema/organizations";
import { schoolProfiles } from "#database/schema/schools";
import { subscriptions } from "#database/schema/subscriptions";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { SetRosterPaidService } from "#modules/orgs/events/rosters/set-paid/service";
import hash from "@adonisjs/core/services/hash";
import { faker } from "@faker-js/faker";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";

const PASSWORD = "permission-test-password";
const originalFetch = globalThis.fetch;

interface TestDancerOptions {
  orgAccountTier?: "standard" | "limited" | null;
  orgAccountTierExpiresAt?: Date | null;
}

async function createDancer(options: TestDancerOptions = {}) {
  const email = faker.internet.email().toLowerCase();
  const [user] = await db
    .insert(users)
    .values({
      username: faker.internet.username().toLowerCase(),
      email,
      displayEmail: email,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: await hash.make(PASSWORD),
      role: "user",
      type: "dancer",
      verified: true,
      orgAccountTier: options.orgAccountTier ?? null,
      orgAccountTierExpiresAt: options.orgAccountTierExpiresAt ?? null,
    })
    .returning();

  await db.insert(dancerProfiles).values({
    userId: user.id,
    birthday: "2008-01-01",
    location: "CA",
  });

  return user;
}

async function createSchool() {
  const email = faker.internet.email().toLowerCase();
  const [user] = await db
    .insert(users)
    .values({
      username: faker.internet.username().toLowerCase(),
      email,
      displayEmail: email,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: await hash.make(PASSWORD),
      role: "user",
      type: "school",
      verified: true,
    })
    .returning();

  await db.insert(schoolProfiles).values({
    userId: user.id,
    name: `${faker.company.name()} ${faker.string.alphanumeric(6)}`,
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

function authenticatedPost(client: ApiClient, path: string, token: string) {
  return client.post(path).header("Authorization", `Bearer ${token}`);
}

async function addYoutubeVideos(
  client: ApiClient,
  token: string,
  count: number
) {
  const responses = [];
  for (let index = 0; index < count; index += 1) {
    responses.push(
      await authenticatedPost(client, "/videos/youtube", token).json({
        videoId: faker.string.alphanumeric({ length: 11 }),
      })
    );
  }
  return responses;
}

function mockSuccessfulCloudflareUpload() {
  globalThis.fetch = async () =>
    new Response(null, {
      status: 201,
      headers: {
        "location": "https://upload.example.test/tus/123",
        "stream-media-id": faker.string.uuid(),
      },
    });
}

async function initiateTus(client: ApiClient, token: string) {
  return authenticatedPost(client, "/videos/tus", token)
    .header("Tus-Resumable", "1.0.0")
    .header("Upload-Length", "1024")
    .header("Upload-Metadata", "filename dGVzdC5tcDQ=");
}

test.group("Dancer media permission matrix", (group) => {
  group.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  group.each.teardown(() => {
    globalThis.fetch = originalFetch;
  });

  test("org-standard dancer can add three YouTube videos but no direct uploads", async ({
    client,
  }) => {
    const dancer = await createDancer({ orgAccountTier: "standard" });
    const token = await bearerToken(client, dancer.email);

    const allowed = await addYoutubeVideos(client, token, 3);
    for (const response of allowed) response.assertStatus(201);

    const fourth = await addYoutubeVideos(client, token, 1);
    fourth[0].assertStatus(403);
    fourth[0].assertBodyContains({
      message:
        "Your organization tier allows up to 3 YouTube videos. Delete one to add another.",
    });

    const tus = await initiateTus(client, token);
    tus.assertStatus(403);
  });

  test("premium grant allows direct uploads and unlimited YouTube videos without Stripe", async ({
    client,
  }) => {
    const dancer = await createDancer();
    await db.insert(premiumGrants).values({
      userId: dancer.id,
      sourceType: "org_event",
      expiresAt: faker.date.future(),
    });
    const token = await bearerToken(client, dancer.email);

    const youtube = await addYoutubeVideos(client, token, 4);
    for (const response of youtube) response.assertStatus(201);

    mockSuccessfulCloudflareUpload();
    const tus = await initiateTus(client, token);
    tus.assertStatus(201);
    tus.assertHeader("stream-media-id");
  });

  test("personal subscription keeps full premium access after roster toggle downgrades org tier", async ({
    assert,
    client,
  }) => {
    const dancer = await createDancer({ orgAccountTier: "standard" });
    await db.insert(subscriptions).values({
      userId: dancer.id,
      source: "stripe",
      status: "active",
      subscriptionId: `sub_${faker.string.alphanumeric(16)}`,
      customerId: `cus_${faker.string.alphanumeric(16)}`,
      currentPeriodEnd: faker.date.future(),
    });

    const [organization] = await db
      .insert(organizations)
      .values({
        name: faker.company.name(),
        slug: `media-${faker.string.alphanumeric(12).toLowerCase()}`,
      })
      .returning();
    const [event] = await db
      .insert(orgEvents)
      .values({
        orgId: organization.id,
        name: faker.company.catchPhrase(),
        startDate: "2026-08-01",
        endDate: "2026-08-02",
      })
      .returning();
    const [roster] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        userId: dancer.id,
        type: "dancer",
        email: dancer.email,
        firstName: dancer.firstName,
        lastName: dancer.lastName,
        paid: true,
      })
      .returning();

    const paidService = new SetRosterPaidService(new DatabaseService());
    await paidService.execute(event.id, roster.id, false, {
      eventId: event.id,
      actorId: dancer.id,
    });

    const updated = await db.query.users.findFirst({
      where: { id: dancer.id },
    });
    assert.equal(updated?.orgAccountTier, "limited");

    const token = await bearerToken(client, dancer.email);
    const youtube = await addYoutubeVideos(client, token, 4);
    for (const response of youtube) response.assertStatus(201);

    mockSuccessfulCloudflareUpload();
    const tus = await initiateTus(client, token);
    tus.assertStatus(201);
  });

  test("freemium dancer cannot add YouTube videos or direct uploads", async ({
    client,
  }) => {
    const dancer = await createDancer();
    const token = await bearerToken(client, dancer.email);

    const youtube = await addYoutubeVideos(client, token, 1);
    youtube[0].assertStatus(403);

    const tus = await initiateTus(client, token);
    tus.assertStatus(403);
  });

  test("expired org-standard tier behaves as freemium", async ({ client }) => {
    const dancer = await createDancer({
      orgAccountTier: "standard",
      orgAccountTierExpiresAt: faker.date.past(),
    });
    const token = await bearerToken(client, dancer.email);

    const youtube = await addYoutubeVideos(client, token, 1);
    youtube[0].assertStatus(403);
  });

  test("org-limited dancer cannot upload videos or photos", async ({
    client,
  }) => {
    const dancer = await createDancer({ orgAccountTier: "limited" });
    const token = await bearerToken(client, dancer.email);

    const youtube = await addYoutubeVideos(client, token, 1);
    youtube[0].assertStatus(403);

    const tus = await initiateTus(client, token);
    tus.assertStatus(403);

    const photo = await authenticatedPost(
      client,
      "/images/presign",
      token
    ).json({
      type: "feed",
      contentType: "image/jpeg",
    });
    photo.assertStatus(403);
    photo.assertBodyContains({
      message: "Photo uploads are not available for your organization tier.",
    });
  });

  test("school account uploads YouTube and direct videos with no subscription and no caps", async ({
    client,
  }) => {
    const school = await createSchool();
    const token = await bearerToken(client, school.email);

    // Beyond the org-standard cap of 3, with no subscription or grant.
    const youtube = await addYoutubeVideos(client, token, 4);
    for (const response of youtube) response.assertStatus(201);

    // Beyond the premium direct-upload cap of 3.
    mockSuccessfulCloudflareUpload();
    for (let index = 0; index < 4; index += 1) {
      const tus = await initiateTus(client, token);
      tus.assertStatus(201);
    }
  });
});
