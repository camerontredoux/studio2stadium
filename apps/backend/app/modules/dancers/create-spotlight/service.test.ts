import { db } from "#database/connection";
import { dancerProfiles, featuredPlacements } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { Service as GetMySpotlightsService } from "#modules/dancers/get-my-spotlights/service";
import { Service as GetPrioritySpotlightsService } from "#modules/dancers/get-priority-spotlights/service";
import { normalizeEmail } from "#utils/normalize-email";
import hash from "@adonisjs/core/services/hash";
import { faker } from "@faker-js/faker";
import { test } from "@japa/runner";
import { and, eq, sql } from "drizzle-orm";
import { Service } from "./service.ts";

const PASSWORD = "create-spotlight-test-password";
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

// Simulate the passage of time by backdating a placement's send/expiry so the
// service's `Date.now()`-based windows resolve as if `daysAgo` have elapsed.
async function backdate(dancerId: string, schoolId: string, daysAgo: number) {
  const sentAt = new Date(Date.now() - daysAgo * DAY_MS);
  await db
    .update(featuredPlacements)
    .set({
      createdAt: sentAt,
      featuredUntil: new Date(sentAt.getTime() + 7 * DAY_MS),
    })
    .where(
      and(
        eq(featuredPlacements.dancerId, dancerId),
        eq(featuredPlacements.schoolId, schoolId)
      )
    );
}

function rows(dancerId: string, schoolId: string) {
  return db
    .select()
    .from(featuredPlacements)
    .where(
      and(
        eq(featuredPlacements.dancerId, dancerId),
        eq(featuredPlacements.schoolId, schoolId)
      )
    );
}

test.group("Create spotlight", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  test("sends a spotlight that is active for 7 days and visible to the program", async ({
    assert,
  }) => {
    const school = await createSchool();
    const dancer = await createDancer();

    const service = new Service(new DatabaseService());
    await service.execute(dancer.id, { schoolId: school.id });

    const placements = await rows(dancer.id, school.id);
    assert.lengthOf(placements, 1);

    const sevenDays = placements[0].featuredUntil.getTime() - Date.now();
    assert.closeTo(sevenDays, 7 * DAY_MS, 60 * 1000);

    // The dancer appears in the program's active Dancer Spotlight section.
    const priority = await new GetPrioritySpotlightsService(
      new DatabaseService()
    ).execute(school.id);
    assert.lengthOf(priority, 1);
    assert.equal(priority[0].id, dancer.id);
    assert.isTrue(priority[0].active);
  });

  test("blocks a second spotlight to the same program within 30 days", async ({
    assert,
  }) => {
    const school = await createSchool();
    const dancer = await createDancer();
    const service = new Service(new DatabaseService());

    await service.execute(dancer.id, { schoolId: school.id });

    await assert.rejects(
      () => service.execute(dancer.id, { schoolId: school.id }),
      /cooldown/
    );

    // No duplicate record was created.
    assert.lengthOf(await rows(dancer.id, school.id), 1);
  });

  test("reports the next eligible date when blocked by cooldown", async ({
    assert,
  }) => {
    const school = await createSchool();
    const dancer = await createDancer();
    const service = new Service(new DatabaseService());

    await service.execute(dancer.id, { schoolId: school.id });

    let meta: Record<string, unknown> | undefined;
    try {
      await service.execute(dancer.id, { schoolId: school.id });
    } catch (error) {
      meta = (error as { meta?: Record<string, unknown> }).meta;
    }

    assert.exists(meta?.nextEligibleAt);
    // Eligible ~30 days after the first send.
    const eligible = new Date(meta!.nextEligibleAt as string).getTime();
    assert.closeTo(eligible, Date.now() + 30 * DAY_MS, 60 * 1000);
  });

  test("allows another spotlight after 30 days and preserves history", async ({
    assert,
  }) => {
    const school = await createSchool();
    const dancer = await createDancer();
    const service = new Service(new DatabaseService());

    await service.execute(dancer.id, { schoolId: school.id });
    // Pretend the first spotlight was sent 31 days ago (expired, cooldown over).
    await backdate(dancer.id, school.id, 31);

    await service.execute(dancer.id, { schoolId: school.id });

    // A new record was created rather than reactivating the old one.
    const placements = await rows(dancer.id, school.id);
    assert.lengthOf(placements, 2);

    const mine = await new GetMySpotlightsService(
      new DatabaseService()
    ).execute(dancer.id);
    assert.lengthOf(mine, 2);
    assert.equal(mine.filter((s) => s.active).length, 1);
    assert.equal(mine.filter((s) => !s.active).length, 1);
  });

  test("allows multiple active spotlights across different programs", async ({
    assert,
  }) => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();
    const dancer = await createDancer();
    const service = new Service(new DatabaseService());

    await service.execute(dancer.id, { schoolId: schoolA.id });
    await service.execute(dancer.id, { schoolId: schoolB.id });

    const mine = await new GetMySpotlightsService(
      new DatabaseService()
    ).execute(dancer.id);
    assert.lengthOf(mine, 2);
    assert.isTrue(mine.every((s) => s.active));
  });

  test("a spotlight to one program does not affect eligibility for another", async ({
    assert,
  }) => {
    const schoolA = await createSchool();
    const schoolB = await createSchool();
    const dancer = await createDancer();
    const service = new Service(new DatabaseService());

    await service.execute(dancer.id, { schoolId: schoolA.id });
    // Still allowed to send to B even though A is on cooldown.
    await service.execute(dancer.id, { schoolId: schoolB.id });

    assert.lengthOf(await rows(dancer.id, schoolB.id), 1);
  });

  test("rejects a spotlight to a program that does not exist", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const service = new Service(new DatabaseService());

    await assert.rejects(
      () => service.execute(dancer.id, { schoolId: faker.string.uuid() }),
      /not found/i
    );
  });

  test("concurrent sends to the same program cannot both bypass the cooldown", async ({
    assert,
  }) => {
    const school = await createSchool();
    const dancer = await createDancer();
    const service = new Service(new DatabaseService());

    const results = await Promise.allSettled([
      service.execute(dancer.id, { schoolId: school.id }),
      service.execute(dancer.id, { schoolId: school.id }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    assert.lengthOf(fulfilled, 1);
    assert.lengthOf(rejected, 1);
    assert.lengthOf(await rows(dancer.id, school.id), 1);
  });
});
