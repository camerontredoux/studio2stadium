import { db } from "#database/connection";
import { users } from "#database/schema/users";
import hash from "@adonisjs/core/services/hash";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";
import { COLUMNS } from "./service.ts";

// Dummy fixtures only.
const PASSWORD = "access-export-test-password";
const URL = "/admin/dancers/access-export";

async function makeUser(name: string, role: "admin" | "user") {
  const email = `${name}@example.test`;
  const [user] = await db
    .insert(users)
    .values({
      username: name,
      email,
      displayEmail: email,
      firstName: "Fixture",
      lastName: name,
      password: await hash.make(PASSWORD),
      role,
      type: "dancer",
      verified: true,
    })
    .returning();
  return user!;
}

async function tokenFor(client: ApiClient, email: string) {
  const res = await client
    .post("/auth/login")
    .header("X-Client-Type", "mobile")
    .json({ email, password: PASSWORD });
  res.assertStatus(200);
  return (res.body() as { token: string }).token;
}

test.group("GET /admin/dancers/access-export", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  test("rejects a signed-out request", async ({ client, assert }) => {
    await makeUser("someone", "user");
    const res = await client.get(URL);
    res.assertStatus(401);
    assert.notInclude(res.text(), "someone@example.test");
  });

  test("rejects a signed-in non-admin", async ({ client, assert }) => {
    const dancer = await makeUser("plain-dancer", "user");
    const res = await client
      .get(URL)
      .header(
        "Authorization",
        `Bearer ${await tokenFor(client, dancer.email)}`
      );
    res.assertStatus(403);
    assert.notInclude(res.text(), "plain-dancer@example.test");
  });

  test("gives an admin an uncached CSV attachment with its row count", async ({
    client,
    assert,
  }) => {
    const admin = await makeUser("staff-admin", "admin");
    await makeUser("dancer-one", "user");
    await makeUser("dancer-two", "user");

    const res = await client
      .get(URL)
      .header("Authorization", `Bearer ${await tokenFor(client, admin.email)}`);

    res.assertStatus(200);
    assert.match(res.header("content-type") ?? "", /^text\/csv/);
    assert.match(
      res.header("content-disposition") ?? "",
      /^attachment; filename="dancer-access-.+\.csv"$/
    );
    assert.include(res.header("cache-control") ?? "", "no-store");
    assert.include(res.header("cache-control") ?? "", "private");
    assert.equal(res.header("x-export-row-count"), "3");
    assert.equal(res.header("x-export-access-lookup-failures"), "0");

    const lines = res.text().trimEnd().split("\r\n");
    assert.equal(lines[0], COLUMNS.join(","));
    assert.lengthOf(lines, 4);
  });
});
