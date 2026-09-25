import { db } from "#database/connection";
import { dancerProfiles } from "#database/schema/dancers";
import { favorites } from "#database/schema/profiles";
import { schoolProfiles } from "#database/schema/schools";
import { dancerSkills, schoolSkills, skills } from "#database/schema/skills";
import { dancerSports, schoolSports, sports } from "#database/schema/sports";
import { dancerStyles, schoolStyles, styles } from "#database/schema/styles";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { normalizeEmail } from "#utils/normalize-email";
import hash from "@adonisjs/core/services/hash";
import { faker } from "@faker-js/faker";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";
import { Service } from "./service.ts";

const PASSWORD = "recommended-dancers-test-password";

const SCHOOL_SKILLS = Array.from({ length: 6 }, (_, i) => `skill-${i}`);
const UNMATCHED_SKILLS = ["skill-90", "skill-91", "skill-92"];

async function seedCatalog() {
  const allSkills = [...SCHOOL_SKILLS, ...UNMATCHED_SKILLS];
  await db
    .insert(skills)
    .values(
      allSkills.map((slug) => ({ slug, name: slug, category: "technique" })),
    );
  await db.insert(styles).values([{ slug: "jazz", name: "Jazz" }]);
  await db.insert(sports).values([{ slug: "cheer", name: "Cheer" }]);
}

async function createSchool(gpa: number | null) {
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
      gpa,
    })
    .returning();

  await db
    .insert(schoolSkills)
    .values(
      SCHOOL_SKILLS.map((slug) => ({
        schoolId: profile.id,
        skillId: slug,
        weight: 3,
      })),
    );
  await db.insert(schoolStyles).values({ schoolId: profile.id, styleId: "jazz" });
  await db
    .insert(schoolSports)
    .values({ schoolId: profile.id, sportId: "cheer" });

  return profile;
}

async function createSchoolWithoutSkills() {
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
      gpa: null,
    })
    .returning();

  return profile;
}

async function createDancer(options: {
  skillSlugs: string[];
  gpa: number | null;
  location?: string;
}) {
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
      location: options.location ?? "CA",
      gpa: options.gpa,
    })
    .returning();

  if (options.skillSlugs.length > 0) {
    await db
      .insert(dancerSkills)
      .values(
        options.skillSlugs.map((slug) => ({
          dancerId: profile.id,
          skillId: slug,
        })),
      );
  }
  await db.insert(dancerStyles).values({ dancerId: profile.id, styleId: "jazz" });
  await db.insert(dancerSports).values({ dancerId: profile.id, sportId: "cheer" });

  return profile;
}

test.group("Recommended dancers for schools", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    await db.execute(sql`truncate table ${skills} cascade`);
    await db.execute(sql`truncate table ${styles} cascade`);
    await db.execute(sql`truncate table ${sports} cascade`);
    await seedCatalog();
  });

  test("recommends matching dancers and excludes no-overlap, unqualified, and favorited", async ({
    assert,
  }) => {
    const school = await createSchool(3.0);

    const strong = await createDancer({
      skillSlugs: SCHOOL_SKILLS,
      gpa: 3.5,
    });
    const noOverlap = await createDancer({
      skillSlugs: UNMATCHED_SKILLS,
      gpa: 3.5,
    });
    const belowGpa = await createDancer({
      skillSlugs: SCHOOL_SKILLS,
      gpa: 2.5,
    });
    const favorited = await createDancer({
      skillSlugs: SCHOOL_SKILLS,
      gpa: 3.5,
    });
    await db.insert(favorites).values({
      schoolId: school.id,
      dancerId: favorited.id,
      platformName: "core",
    });

    const service = new Service(new DatabaseService());
    const results = await service.execute(school.id, { limit: 10 });
    const ids = results.map((r) => r.id);

    assert.include(ids, strong.id);
    assert.notInclude(ids, noOverlap.id);
    assert.notInclude(ids, belowGpa.id);
    assert.notInclude(ids, favorited.id);
  });

  test("returns nothing when the school has no skill preferences set", async ({
    assert,
  }) => {
    const school = await createSchoolWithoutSkills();
    await createDancer({ skillSlugs: SCHOOL_SKILLS, gpa: 3.5 });

    const service = new Service(new DatabaseService());
    const results = await service.execute(school.id, { limit: 10 });

    assert.lengthOf(results, 0);
  });
});
