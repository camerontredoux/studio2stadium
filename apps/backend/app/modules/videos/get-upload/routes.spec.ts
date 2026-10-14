import { db } from "#database/connection";
import { videoUploads } from "#database/schema/media";
import { users } from "#database/schema/users";
import { normalizeEmail } from "#utils/normalize-email";
import hash from "@adonisjs/core/services/hash";
import { faker } from "@faker-js/faker";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";

const PASSWORD = "get-upload-test-password";

async function createUser(role: "user" | "admin" = "user") {
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
      role,
      type: "dancer",
      verified: true,
    })
    .returning();
  return user;
}

async function createFailedUpload(userId: string) {
  const mediaId = faker.string.uuid();
  await db.insert(videoUploads).values({
    userId,
    cloudflareMediaId: mediaId,
    status: "failed",
    errorMessage: "The video is longer than 2 minutes.",
  });
  return mediaId;
}

async function getUpload(client: ApiClient, email: string, mediaId: string) {
  const login = await client
    .post("/auth/login")
    .header("X-Client-Type", "mobile")
    .json({ email, password: PASSWORD });
  login.assertStatus(200);

  return client
    .get(`/videos/uploads/${mediaId}`)
    .header("Authorization", `Bearer ${login.body().token}`);
}

test.group("Videos / get upload", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  test("the owner reads the upload's status and error", async ({ client }) => {
    const owner = await createUser();
    const mediaId = await createFailedUpload(owner.id);

    const response = await getUpload(client, owner.email, mediaId);

    response.assertStatus(200);
    response.assertBody({
      mediaId,
      status: "failed",
      errorMessage: "The video is longer than 2 minutes.",
    });
  });

  test("another user cannot read it", async ({ client }) => {
    const owner = await createUser();
    const mediaId = await createFailedUpload(owner.id);
    const other = await createUser();

    const response = await getUpload(client, other.email, mediaId);

    response.assertStatus(404);
  });

  test("an admin can read it", async ({ client }) => {
    const owner = await createUser();
    const mediaId = await createFailedUpload(owner.id);
    const admin = await createUser("admin");

    const response = await getUpload(client, admin.email, mediaId);

    response.assertStatus(200);
    response.assertBodyContains({ status: "failed" });
  });
});
