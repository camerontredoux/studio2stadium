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

const PASSWORD = "my-spotlights-test-password";
const DAY_MS = 24 * 60 * 60 * 1000;

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

async function send(dancerId: string, schoolId: string, sentAt: Date) {
  await db.insert(featuredPlacements).values({
    dancerId,
    schoolId,
    featuredUntil: new Date(sentAt.getTime() + 7 * DAY_MS),
    createdAt: sentAt,
    updatedAt: sentAt,
  });
}

test.group("Get my spotlights", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  test("marks a fresh spotlight active and exposes its next eligible date", async ({
    assert,
  }) => {
    const school = await createSchool();
    const dancer = await createDancer();

    const sentAt = new Date();
    await send(dancer.id, school.id, sentAt);

    const [spotlight] = await new Service(new DatabaseService()).execute(
      dancer.id
    );

    assert.isTrue(spotlight.active);
    assert.equal(spotlight.name, school.name);
    // Eligible to send again 30 days after it was sent.
    assert.closeTo(
      new Date(spotlight.nextEligibleAt).getTime(),
      sentAt.getTime() + 30 * DAY_MS,
      1000
    );
  });

  test("a spotlight older than 7 days is expired and kept in history", async ({
    assert,
  }) => {
    const school = await createSchool();
    const dancer = await createDancer();

    // Sent 8 days ago: the 7-day window has closed.
    await send(dancer.id, school.id, new Date(Date.now() - 8 * DAY_MS));

    const [spotlight] = await new Service(new DatabaseService()).execute(
      dancer.id
    );

    assert.isFalse(spotlight.active);
  });
});
