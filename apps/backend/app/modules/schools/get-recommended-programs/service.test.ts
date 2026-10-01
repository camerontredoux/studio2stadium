import { db } from "#database/connection";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import {
  dancerSkills,
  schoolSkills,
  skillRarity,
  skills,
} from "#database/schema/skills";
import { dancerSports, sports } from "#database/schema/sports";
import { dancerStyles, schoolStyles, styles } from "#database/schema/styles";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { normalizeEmail } from "#utils/normalize-email";
import hash from "@adonisjs/core/services/hash";
import { faker } from "@faker-js/faker";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";
import { Service } from "./service.ts";

const PASSWORD = "recommended-test-password";

// A dancer needs >=10 skills to be eligible for recommendations at all.
const DANCER_SKILLS = Array.from({ length: 12 }, (_, i) => `skill-${i}`);
// Skills no test dancer has — used to build a school with zero skill overlap.
const UNMATCHED_SKILLS = ["skill-90", "skill-91", "skill-92"];

async function seedCatalog() {
  const allSkills = [...DANCER_SKILLS, ...UNMATCHED_SKILLS];
  await db
    .insert(skills)
    .values(
      allSkills.map((slug) => ({ slug, name: slug, category: "technique" }))
    );
  await db
    .insert(skillRarity)
    .values(allSkills.map((slug) => ({ skillId: slug, rarity: 0.5, count: 1 })));
  await db
    .insert(styles)
    .values([{ slug: "jazz", name: "Jazz" }, { slug: "ballet", name: "Ballet" }]);
  await db.insert(sports).values([{ slug: "cheer", name: "Cheer" }]);
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
      gpa: 3.8,
    })
    .returning();

  await db
    .insert(dancerSkills)
    .values(DANCER_SKILLS.map((slug) => ({ dancerId: profile.id, skillId: slug })));
  await db.insert(dancerStyles).values({ dancerId: profile.id, styleId: "jazz" });
  await db.insert(dancerSports).values({ dancerId: profile.id, sportId: "cheer" });

  return profile;
}

async function createSchool(options: {
  name: string;
  location: string;
  gpa: number | null;
  skillSlugs: string[];
  styleSlugs?: string[];
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
      type: "school",
      verified: true,
    })
    .returning();

  const [profile] = await db
    .insert(schoolProfiles)
    .values({
      userId: user.id,
      name: options.name,
      location: options.location,
      gpa: options.gpa,
    })
    .returning();

  if (options.skillSlugs.length > 0) {
    await db
      .insert(schoolSkills)
      .values(
        options.skillSlugs.map((slug) => ({
          schoolId: profile.id,
          skillId: slug,
          weight: 5,
        }))
      );
  }
  for (const styleSlug of options.styleSlugs ?? []) {
    await db
      .insert(schoolStyles)
      .values({ schoolId: profile.id, styleId: styleSlug });
  }

  return profile;
}

test.group("Recommended programs skill gating", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    await db.execute(sql`truncate table ${skills} cascade`);
    await db.execute(sql`truncate table ${styles} cascade`);
    await db.execute(sql`truncate table ${sports} cascade`);
    await seedCatalog();
  });

  test("excludes an in-state, GPA-met school the dancer shares no skills with", async ({
    assert,
  }) => {
    const dancer = await createDancer();

    // Shares 5 skills + jazz with the dancer — a real match.
    const matching = await createSchool({
      name: "Matching U",
      location: "CA",
      gpa: 3.0,
      skillSlugs: DANCER_SKILLS.slice(0, 5),
      styleSlugs: ["jazz"],
    });

    // Zero skill overlap, but same state (+5) and a GPA the dancer meets
    // (+bonus). Under the old filter this scored > 0 and surfaced anyway.
    const skillless = await createSchool({
      name: "Skill-less U",
      location: "CA",
      gpa: 3.0,
      skillSlugs: UNMATCHED_SKILLS,
    });

    const service = new Service(new DatabaseService());
    const results = await service.execute(dancer.id, { limit: 10 });

    const ids = results.map((r) => r.id);
    assert.include(ids, matching.id);
    assert.notInclude(ids, skillless.id);
  });

  test("returns no recommendations when the dancer's profile is incomplete", async ({
    assert,
  }) => {
    // Eligible-looking school exists...
    await createSchool({
      name: "Matching U",
      location: "CA",
      gpa: 3.0,
      skillSlugs: DANCER_SKILLS.slice(0, 5),
      styleSlugs: ["jazz"],
    });

    // ...but the dancer has too few skills to be eligible.
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
      .values({ userId: user.id, birthday: "2008-01-01", location: "CA", gpa: 3.8 })
      .returning();
    await db
      .insert(dancerSkills)
      .values(DANCER_SKILLS.slice(0, 3).map((slug) => ({ dancerId: profile.id, skillId: slug })));
    await db.insert(dancerStyles).values({ dancerId: profile.id, styleId: "jazz" });
    await db.insert(dancerSports).values({ dancerId: profile.id, sportId: "cheer" });

    const service = new Service(new DatabaseService());
    const results = await service.execute(profile.id, { limit: 10 });

    assert.lengthOf(results, 0);
  });
});
