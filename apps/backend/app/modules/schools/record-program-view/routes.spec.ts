import { db } from "#database/connection";
import { programViews } from "#database/schema/profiles";
import { users } from "#database/schema/users";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";
import {
  createDancer,
  createSchool,
  login,
  subscribe,
} from "#tests/helpers/premium";

test.group("POST /schools/:id/view", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  test("viewing the same program five times records one view", async ({
    client,
    assert,
  }) => {
    const dancer = await createDancer();
    await subscribe(dancer.id);
    const school = await createSchool();
    const token = await login(client, dancer.email);

    for (let i = 0; i < 5; i += 1) {
      const response = await client
        .post(`/schools/${school.id}/view`)
        .bearerToken(token);
      response.assertStatus(204);
    }

    const rows = await db.select().from(programViews);
    assert.lengthOf(rows, 1);
    assert.equal(rows[0].dancerId, dancer.profileId);
  });

  test("requires Premium", async ({ client }) => {
    const dancer = await createDancer();
    const school = await createSchool();
    const token = await login(client, dancer.email);

    const response = await client
      .post(`/schools/${school.id}/view`)
      .bearerToken(token);
    response.assertStatus(403);
  });
});
