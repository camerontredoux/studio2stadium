import { db } from "#database/connection";
import { users } from "#database/schema/users";
import {
  buyWeekPass,
  createDancer,
  login,
  subscribe,
} from "#tests/helpers/premium";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";

test.group("Common Recruit submissions by plan", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  test("a Week Pass cannot submit; Monthly gets past the plan check", async ({
    client,
  }) => {
    const pass = await createDancer();
    await buyWeekPass(pass.id);
    const monthly = await createDancer();
    await subscribe(monthly.id, { interval: "monthly" });

    const submit = async (email: string) =>
      client
        .post("/dancers/submissions")
        .header("Authorization", `Bearer ${await login(client, email)}`)
        .json({});

    const refused = await submit(pass.email);
    refused.assertStatus(403);
    refused.assertBodyContains({
      message: "This feature needs a Monthly, Season Pass, or Annual plan.",
    });

    // The empty body fails validation, which runs after the plan check.
    const allowed = await submit(monthly.email);
    allowed.assertStatus(422);
  });
});
