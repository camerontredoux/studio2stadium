import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { createSchool } from "#tests/helpers/premium";
import { faker } from "@faker-js/faker";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
import { Service } from "./service.ts";

const originalFetch = globalThis.fetch;

test.group("Admin / upload school video / owner", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    return () => {
      globalThis.fetch = originalFetch;
    };
  });

  test("tags the Stream upload with the school's user", async ({ assert }) => {
    const school = await createSchool();
    const [user] = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, school.userId));
    const uploads: Headers[] = [];
    globalThis.fetch = async (_input, init) => {
      uploads.push(new Headers(init?.headers));
      return new Response(null, {
        status: 201,
        headers: {
          "location": "https://upload.example.test/tus/123",
          "stream-media-id": faker.string.alphanumeric(32),
        },
      });
    };
    const spoofed = Buffer.from(faker.string.uuid()).toString("base64");

    await new Service(new DatabaseService()).initiateUpload({
      username: user.username,
      uploadLength: "1024",
      uploadMetadata: `filename dGVzdC5tcDQ=,userId ${spoofed}`,
    });

    assert.lengthOf(uploads, 1);
    assert.equal(uploads[0].get("Upload-Creator"), school.userId);
    const metadata = uploads[0].get("Upload-Metadata")!.split(",");
    assert.include(
      metadata,
      `userId ${Buffer.from(school.userId).toString("base64")}`
    );
    assert.notInclude(metadata, `userId ${spoofed}`);
  });
});
