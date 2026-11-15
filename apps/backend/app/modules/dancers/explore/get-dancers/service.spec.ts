import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import {
  buyWeekPass,
  createDancer,
  createSchool,
} from "#tests/helpers/premium";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";
import { Service } from "./service.ts";
import { type Validator } from "./validator.ts";

test.group("Explore dancers for coaches", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  test("a Dancer on a running Week Pass is listed as paying, like a subscriber", async ({
    assert,
  }) => {
    const school = await createSchool();
    const pass = await createDancer();
    await buyWeekPass(pass.id);
    const lapsed = await createDancer();
    await buyWeekPass(lapsed.id, new Date(Date.now() - 60_000));

    const { dancers } = await new Service(new DatabaseService()).execute(
      { premium: true } as Validator,
      false,
      school.userId
    );

    assert.deepEqual(
      dancers.map((dancer) => [dancer.username, dancer.subscribed]),
      [[pass.username, true]]
    );
  });
});
