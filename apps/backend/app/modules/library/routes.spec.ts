import { db } from "#database/connection";
import { users } from "#database/schema/users";
import {
  buyWeekPass,
  createDancer,
  login,
  subscribe,
} from "#tests/helpers/premium";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";

// Free members get the blog only; training videos need a Week Pass or Premium.
test.group("Training library access", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  const expectStatus = async (
    client: ApiClient,
    token: string,
    path: string,
    status: number
  ) => {
    const response = await client
      .get(path)
      .header("Authorization", `Bearer ${token}`);
    response.assertStatus(status);
  };

  test("Free reads the blog but not the library", async ({ client }) => {
    const free = await createDancer();
    const token = await login(client, free.email);

    await expectStatus(client, token, "/library", 403);
    await expectStatus(client, token, "/library/technique", 403);
    await expectStatus(client, token, "/blog", 200);
  });

  test("a Week Pass and Premium read the library", async ({ client }) => {
    const pass = await createDancer();
    await buyWeekPass(pass.id);
    const premium = await createDancer();
    await subscribe(premium.id);

    for (const dancer of [pass, premium]) {
      const token = await login(client, dancer.email);
      await expectStatus(client, token, "/library", 200);
    }
  });
});
