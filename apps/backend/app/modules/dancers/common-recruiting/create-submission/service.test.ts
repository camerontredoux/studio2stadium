import { db } from "#database/connection";
import { crvSubmissions } from "#database/schema/crv";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { normalizeEmail } from "#utils/normalize-email";
import hash from "@adonisjs/core/services/hash";
import { faker } from "@faker-js/faker";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
import { Service } from "./service.ts";

const PASSWORD = "create-submission-test-password";

async function createDancer(gradYear: number | null) {
  const displayEmail = faker.internet.email().toLowerCase();
  const email = await normalizeEmail(displayEmail);
  const [user] = await db
    .insert(users)
    .values({
      username: faker.internet.username().toLowerCase(),
      email,
      displayEmail,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: await hash.make(PASSWORD),
      role: "user",
      type: "dancer",
      verified: true,
    })
    .returning();

  const [profile] = await db
    .insert(dancerProfiles)
    .values({
      userId: user.id,
      birthday: "2008-01-01",
      location: "CA",
      gradYear,
    })
    .returning();

  return profile;
}

async function createSchool() {
  const displayEmail = faker.internet.email().toLowerCase();
  const email = await normalizeEmail(displayEmail);
  const [user] = await db
    .insert(users)
    .values({
      username: faker.internet.username().toLowerCase(),
      email,
      displayEmail,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: await hash.make(PASSWORD),
      role: "user",
      type: "school",
      verified: true,
    })
    .returning();

  const [profile] = await db
    .insert(schoolProfiles)
    .values({
      userId: user.id,
      name: `${faker.company.name()} ${faker.string.alphanumeric(6)}`,
      location: "CA",
      commonRecruiting: true,
    })
    .returning();

  return profile;
}

test.group("Create submission senior gating", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  // Graduating seniors (2027) and older (already graduated: 2026, 2025) may
  // submit; younger dancers may not.
  for (const gradYear of [2027, 2026, 2025]) {
    test(`lets a graduating senior or older (grad year ${gradYear}) submit`, async ({
      assert,
    }) => {
      const dancer = await createDancer(gradYear);
      const school = await createSchool();

      const service = new Service(new DatabaseService());
      await service.execute(dancer.id, {
        schoolId: [school.id],
        videoId: "dQw4w9WgXcQ",
      });

      const submissions = await db
        .select()
        .from(crvSubmissions)
        .where(eq(crvSubmissions.dancerId, dancer.id));

      assert.lengthOf(submissions, 1);
      assert.equal(submissions[0].schoolId, school.id);
    });
  }

  test("rejects a younger dancer (grad year 2028) and creates no submission", async ({
    assert,
  }) => {
    const dancer = await createDancer(2028);
    const school = await createSchool();

    const service = new Service(new DatabaseService());

    await assert.rejects(() =>
      service.execute(dancer.id, {
        schoolId: [school.id],
        videoId: "dQw4w9WgXcQ",
      })
    );

    const submissions = await db
      .select()
      .from(crvSubmissions)
      .where(eq(crvSubmissions.dancerId, dancer.id));

    assert.lengthOf(submissions, 0);
  });

  test("rejects a dancer with no grad year and creates no submission", async ({
    assert,
  }) => {
    const dancer = await createDancer(null);
    const school = await createSchool();

    const service = new Service(new DatabaseService());

    await assert.rejects(() =>
      service.execute(dancer.id, {
        schoolId: [school.id],
        videoId: "dQw4w9WgXcQ",
      })
    );

    const submissions = await db
      .select()
      .from(crvSubmissions)
      .where(eq(crvSubmissions.dancerId, dancer.id));

    assert.lengthOf(submissions, 0);
  });
});
