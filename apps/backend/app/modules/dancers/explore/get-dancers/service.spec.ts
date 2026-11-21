import { db } from "#database/connection";
import { dancerProfiles } from "#database/schema/dancers";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import {
  buyWeekPass,
  createDancer,
  createSchool,
} from "#tests/helpers/premium";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
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

  test("gradYear lists only that Class of YYYY and paginates within it", async ({
    assert,
  }) => {
    const school = await createSchool();
    const classOf = async (year: number | null) => {
      const dancer = await createDancer();
      await db
        .update(dancerProfiles)
        .set({ gradYear: year })
        .where(eq(dancerProfiles.id, dancer.profileId));
      return dancer;
    };
    const first = await classOf(2027);
    const second = await classOf(2027);
    await classOf(2028);
    await classOf(null);

    const service = new Service(new DatabaseService());
    const page0 = await service.execute(
      { gradYear: 2027, limit: 1 } as Validator,
      false,
      school.userId
    );
    const page1 = await service.execute(
      { gradYear: 2027, limit: 1, page: 1 } as Validator,
      false,
      school.userId
    );

    assert.equal(page0.pagination.total, 2);
    assert.equal(page0.pagination.totalPages, 2);
    assert.isTrue(page0.pagination.hasNextPage);
    assert.isFalse(page1.pagination.hasNextPage);
    assert.sameMembers(
      [...page0.dancers, ...page1.dancers].map((d) => d.username),
      [first.username, second.username]
    );
    assert.isTrue(
      [...page0.dancers, ...page1.dancers].every((d) => d.gradYear === 2027)
    );

    const all = await service.execute({} as Validator, false, school.userId);
    assert.equal(all.pagination.total, 4);
  });
});
