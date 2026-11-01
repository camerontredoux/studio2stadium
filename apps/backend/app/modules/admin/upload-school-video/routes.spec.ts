import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { normalizeEmail } from "#utils/normalize-email";
import hash from "@adonisjs/core/services/hash";
import { faker } from "@faker-js/faker";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";

const PASSWORD = "upload-school-video-test-password";

test.group("Admin / upload school video", (group) => {
  group.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  test("rejects an upload larger than 500MB", async ({ client }) => {
    const displayEmail = faker.internet.email().toLowerCase();
    const email = await normalizeEmail(displayEmail);
    await db.insert(users).values({
      username: faker.internet.username().toLowerCase(),
      email,
      displayEmail,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: await hash.make(PASSWORD),
      role: "admin",
      type: "dancer",
      verified: true,
    });
    const login = await client
      .post("/auth/login")
      .header("X-Client-Type", "mobile")
      .json({ email, password: PASSWORD });
    login.assertStatus(200);

    const response = await client
      .post("/admin/schools/any-school/videos/tus")
      .header("Authorization", `Bearer ${login.body().token}`)
      .header("Tus-Resumable", "1.0.0")
      .header("Upload-Length", "524288001");

    response.assertStatus(400);
    response.assertBodyContains({
      error: "The video must be smaller than 500MB.",
    });
  });
});
