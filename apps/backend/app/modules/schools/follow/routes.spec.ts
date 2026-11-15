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

// A Week Pass follows at most five programs and cannot show interest at all;
// Premium has no cap on either.
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

  test("a Week Pass cannot show interest; Premium can", async ({ client }) => {
    const school = await createSchool();

    const pass = await createDancer();
    await buyWeekPass(pass.id);
    const passToken = await login(client, pass.email);

    const blocked = await post(
      client,
      passToken,
      `/schools/${school.id}/interest`
    );
    blocked.assertStatus(403);
    blocked.assertBodyContains({
      message: "This feature needs a Monthly, Season Pass, or Annual plan.",
    });

    const premium = await createDancer();
    await subscribe(premium.id);
    const premiumToken = await login(client, premium.email);

    // Up to three pushes to the same program.
    for (let push = 0; push < 3; push++) {
      await expectStatus(
        client,
        premiumToken,
        `/schools/${school.id}/interest`,
        201
      );
    }
    await expectStatus(
      client,
      premiumToken,
      `/schools/${school.id}/interest`,
      400
    );
  });
});
