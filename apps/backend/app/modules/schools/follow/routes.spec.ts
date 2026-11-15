import { db } from "#database/connection";
import { users } from "#database/schema/users";
import {
  buyWeekPass,
  createDancer,
  createSchool,
  login,
  subscribe,
} from "#tests/helpers/premium";
import emitter from "@adonisjs/core/services/emitter";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";

// A Week Pass reaches at most five programs, by follows and by showing
// interest; Premium has no cap.
test.group("Programs a Week Pass can reach", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    emitter.fake();
    return () => emitter.restore();
  });

  const post = (client: ApiClient, token: string, path: string) =>
    client.post(path).header("Authorization", `Bearer ${token}`);

  const expectStatus = async (
    client: ApiClient,
    token: string,
    path: string,
    status: number
  ) => {
    const response = await post(client, token, path);
    response.assertStatus(status);
  };

  test("a Week Pass follows five programs; Premium follows more", async ({
    client,
  }) => {
    const schools = await Promise.all(Array.from({ length: 6 }, createSchool));

    const pass = await createDancer();
    await buyWeekPass(pass.id);
    const passToken = await login(client, pass.email);

    for (const school of schools.slice(0, 5)) {
      await expectStatus(
        client,
        passToken,
        `/schools/${school.id}/follow`,
        201
      );
    }
    const sixth = await post(
      client,
      passToken,
      `/schools/${schools[5]!.id}/follow`
    );
    sixth.assertStatus(400);
    sixth.assertBodyContains({
      message:
        "A 1-Week Pass lets you follow up to 5 programs. Unfollow one, or upgrade to Premium to follow more.",
    });
    // Following a program again does not count as a sixth.
    await expectStatus(
      client,
      passToken,
      `/schools/${schools[0]!.id}/follow`,
      204
    );

    const premium = await createDancer();
    await subscribe(premium.id);
    const premiumToken = await login(client, premium.email);

    for (const school of schools) {
      await expectStatus(
        client,
        premiumToken,
        `/schools/${school.id}/follow`,
        201
      );
    }
  });

  test("a Week Pass shows interest in five programs", async ({ client }) => {
    const schools = await Promise.all(Array.from({ length: 6 }, createSchool));

    const pass = await createDancer();
    await buyWeekPass(pass.id);
    const token = await login(client, pass.email);

    for (const school of schools.slice(0, 5)) {
      await expectStatus(client, token, `/schools/${school.id}/interest`, 201);
    }
    await expectStatus(
      client,
      token,
      `/schools/${schools[5]!.id}/interest`,
      400
    );
    // A second push to a program already reached is still allowed.
    await expectStatus(
      client,
      token,
      `/schools/${schools[0]!.id}/interest`,
      201
    );
  });
});
