import { db } from "#database/connection";
import { dancerProfiles } from "#database/schema/dancers";
import { videoUploads } from "#database/schema/media";
import { premiumGrants } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { normalizeEmail } from "#utils/normalize-email";
import hash from "@adonisjs/core/services/hash";
import { faker } from "@faker-js/faker";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";

const PASSWORD = "tus-upload-test-password";
const originalFetch = globalThis.fetch;

async function createPremiumDancer() {
  const displayEmail = faker.internet.email().toLowerCase();
  const email = await normalizeEmail(displayEmail);
  const [user] = await db
    .insert(users)
    .values({
      username: faker.internet.username().toLowerCase(),
      email,
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
  await db.insert(premiumGrants).values({
    userId: user.id,
    sourceType: "org_event",
    expiresAt: faker.date.future(),
  });

  return user;
}

async function createUnfinishedUploads(userId: string, total: number) {
  await db.insert(videoUploads).values(
    Array.from({ length: total }, () => ({
      userId,
      cloudflareMediaId: faker.string.uuid(),
      status: "pending" as const,
    }))
  );
}

// Cloudflare reports `existingState` for every upload the user already
// started, and accepts the new tus upload. Returns the headers of each upload
// sent to Cloudflare.
function mockCloudflare(existingState: string) {
  const uploads: Headers[] = [];
  globalThis.fetch = async (_input, init) => {
    if (init?.method === "POST") {
      uploads.push(new Headers(init.headers));
      return new Response(null, {
        status: 201,
        headers: {
          "location": "https://upload.example.test/tus/123",
          "stream-media-id": faker.string.uuid(),
        },
      });
    }

    return Response.json({ result: { status: { state: existingState } } });
  };
  return uploads;
}

async function bearerToken(client: ApiClient, email: string) {
  const response = await client
    .post("/auth/login")
    .header("X-Client-Type", "mobile")
    .json({ email, password: PASSWORD });

  response.assertStatus(200);
  return (response.body() as { token: string }).token;
}

function initiateTus(
  client: ApiClient,
  token: string,
  { metadata = "filename dGVzdC5tcDQ=", uploadLength = "1024" } = {}
) {
  return client
    .post("/videos/tus")
    .header("Authorization", `Bearer ${token}`)
    .header("Tus-Resumable", "1.0.0")
    .header("Upload-Length", uploadLength)
    .header("Upload-Metadata", metadata);
}

test.group("Videos / tus upload limit", (group) => {
  group.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  group.each.teardown(() => {
    globalThis.fetch = originalFetch;
  });

  test("uploads that never finished do not count toward the limit", async ({
    client,
  }) => {
    const dancer = await createPremiumDancer();
    await createUnfinishedUploads(dancer.id, 3);
    const token = await bearerToken(client, dancer.email);

    mockCloudflare("pendingupload");
    const response = await initiateTus(client, token);

    response.assertStatus(201);
    response.assertHeader("stream-media-id");
  });

  test("uploads Cloudflare rejected do not count toward the limit", async ({
    client,
  }) => {
    const dancer = await createPremiumDancer();
    await createUnfinishedUploads(dancer.id, 3);
    const token = await bearerToken(client, dancer.email);

    mockCloudflare("error");
    const response = await initiateTus(client, token);

    response.assertStatus(201);
  });

  test("uploads Cloudflare received still count toward the limit", async ({
    client,
  }) => {
    const dancer = await createPremiumDancer();
    await createUnfinishedUploads(dancer.id, 3);
    const token = await bearerToken(client, dancer.email);

    mockCloudflare("inprogress");
    const response = await initiateTus(client, token);

    response.assertStatus(403);
    response.assertBodyContains({
      message:
        "You can only upload 3 videos. Delete an existing video to upload a new one.",
    });
  });
});

test.group("Videos / tus upload owner", (group) => {
  group.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  group.each.teardown(() => {
    globalThis.fetch = originalFetch;
  });

  test("tags the Stream upload with the uploader, whatever the client sends", async ({
    assert,
    client,
  }) => {
    const dancer = await createPremiumDancer();
    const token = await bearerToken(client, dancer.email);
    const spoofed = Buffer.from(faker.string.uuid()).toString("base64");

    const uploads = mockCloudflare("pendingupload");
    const response = await initiateTus(client, token, {
      metadata: `filename dGVzdC5tcDQ=,userId ${spoofed}`,
    });

    response.assertStatus(201);
    assert.lengthOf(uploads, 1);
    assert.equal(uploads[0].get("Upload-Creator"), dancer.id);
    const metadata = uploads[0].get("Upload-Metadata")!.split(",");
    assert.include(
      metadata,
      `userId ${Buffer.from(dancer.id).toString("base64")}`
    );
    assert.notInclude(metadata, `userId ${spoofed}`);
  });
});

test.group("Videos / tus upload size", (group) => {
  group.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  group.each.teardown(() => {
    globalThis.fetch = originalFetch;
  });

  test("rejects an Upload-Length of {$self}")
    .with(["abc", "0", "524288001"])
    .run(async ({ client }, uploadLength) => {
      const dancer = await createPremiumDancer();
      const token = await bearerToken(client, dancer.email);
      mockCloudflare("pendingupload");

      const response = await initiateTus(client, token, { uploadLength });

      response.assertStatus(400);
      response.assertBodyContains({
        error: "The video must be smaller than 500MB.",
      });
    });

  test("accepts an upload of exactly 500MB", async ({ client }) => {
    const dancer = await createPremiumDancer();
    const token = await bearerToken(client, dancer.email);
    mockCloudflare("pendingupload");

    const response = await initiateTus(client, token, {
      uploadLength: "524288000",
    });

    response.assertStatus(201);
  });
});
