import { test } from "@japa/runner";
import { eq } from "drizzle-orm";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { favorites } from "#database/schema/profiles";
import { organizations } from "#database/schema/organizations";
import { csvUploads, eventRosters, orgEvents } from "#database/schema/org-events";
import { orgMemberships } from "#database/schema/organizations";
import { seedOrganizations } from "#commands/backfill-organizations";
import { backfillSchoolFavoritesOrg } from "#commands/backfill-school-favorites-org";

async function fixtures() {
  const [dancerUser] = await db
    .insert(users)
    .values({
      username: "fav-d",
      email: "fav-d@example.com",
      role: "user",
      type: "dancer",
      displayEmail: "fav-d@example.com",
      firstName: "Fav",
      lastName: "Dancer",
      password: "x",
    })
    .returning();
  const [schoolUser] = await db
    .insert(users)
    .values({
      username: "fav-s",
      email: "fav-s@example.com",
      role: "user",
      type: "school",
      displayEmail: "fav-s@example.com",
      firstName: "Fav",
      lastName: "School",
      password: "x",
    })
    .returning();

  const [dp] = await db
    .insert(dancerProfiles)
    .values({
      userId: dancerUser!.id,
      birthday: "2006-01-01",
      location: "CA",
    })
    .returning();
  const [sp] = await db
    .insert(schoolProfiles)
    .values({
      userId: schoolUser!.id,
      name: "Test University",
      location: "NY",
    })
    .returning();

  return { dp: dp!, sp: sp! };
}

test.group("backfill school_favorites.source_org_id", (group) => {
  group.each.setup(async () => {
    await db.delete(csvUploads).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(favorites).execute();
    await db.delete(dancerProfiles).execute();
    await db.delete(schoolProfiles).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();
  });

  test("fills source_org_id based on platform_name=core", async ({
    assert,
  }) => {
    const { dp, sp } = await fixtures();
    const [row] = await db
      .insert(favorites)
      .values({
        schoolId: sp.id,
        dancerId: dp.id,
        platformName: "core",
      })
      .returning();
    assert.isNull(row!.sourceOrgId);

    await backfillSchoolFavoritesOrg();

    const [after] = await db
      .select()
      .from(favorites)
      .where(eq(favorites.id, row!.id));
    const [core] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "core"));
    assert.equal(after!.sourceOrgId, core!.id);
  });

  test("fills source_org_id based on platform_name=prodigy", async ({
    assert,
  }) => {
    const { dp, sp } = await fixtures();
    const [row] = await db
      .insert(favorites)
      .values({
        schoolId: sp.id,
        dancerId: dp.id,
        platformName: "prodigy",
      })
      .returning();
    await backfillSchoolFavoritesOrg();
    const [after] = await db
      .select()
      .from(favorites)
      .where(eq(favorites.id, row!.id));
    const [prodigy] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "prodigy"));
    assert.equal(after!.sourceOrgId, prodigy!.id);
  });

  test("leaves already-populated rows untouched on second run", async ({
    assert,
  }) => {
    const { dp, sp } = await fixtures();
    const [row] = await db
      .insert(favorites)
      .values({
        schoolId: sp.id,
        dancerId: dp.id,
        platformName: "core",
      })
      .returning();
    await backfillSchoolFavoritesOrg();
    const count1 = await backfillSchoolFavoritesOrg();
    assert.equal(count1, 0);
    const [after] = await db
      .select()
      .from(favorites)
      .where(eq(favorites.id, row!.id));
    const [core] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "core"));
    assert.equal(after!.sourceOrgId, core!.id);
  });
});
