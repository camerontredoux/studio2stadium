import { db } from "#database/connection";
import { dancerProfiles, featuredPlacements } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { normalizeEmail } from "#utils/normalize-email";
import hash from "@adonisjs/core/services/hash";
import { faker } from "@faker-js/faker";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";
import { Service } from "./service.ts";

const PASSWORD = "priority-spotlights-test-password";

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
    })
    .returning();

  return profile;
}

async function createDancer() {
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
      gpa: 3.9,
      gradYear: 2027,
    })
    .returning();

  return profile;
}

async function feature(
  dancerId: string,
  schoolId: string,
  featuredUntil: Date
) {
  await db
    .insert(featuredPlacements)
    .values({ dancerId, schoolId, featuredUntil });
}

test.group("Priority spotlights", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  test("returns active placements for the viewing school only", async ({
    assert,
  }) => {
    const school = await createSchool();
    const otherSchool = await createSchool();

    const active = await createDancer();
    const otherSchoolsDancer = await createDancer();

    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await feature(active.id, school.id, future);
    // Featured to a different program — must not appear for this school.
    await feature(otherSchoolsDancer.id, otherSchool.id, future);

    const service = new Service(new DatabaseService());
    const results = await service.execute(school.id);
    const ids = results.map((r) => r.id);

    assert.include(ids, active.id);
    assert.notInclude(ids, otherSchoolsDancer.id);
    assert.lengthOf(results, 1);
    assert.equal(results[0].gradYear, 2027);
    assert.isTrue(results[0].active);
  });

  test("returns expired placements marked inactive", async ({ assert }) => {
    const school = await createSchool();
    const dancer = await createDancer();

    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await feature(dancer.id, school.id, past);

    const service = new Service(new DatabaseService());
    const results = await service.execute(school.id);

    assert.lengthOf(results, 1);
    assert.isFalse(results[0].active);
  });
});
