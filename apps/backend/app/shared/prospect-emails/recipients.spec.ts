import { test } from "@japa/runner";
import { db } from "#database/connection";
import { crvSubmissions } from "#database/schema/crv";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { findProspectEmailRecipients } from "./recipients.ts";

let seq = 0;
function unique(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}`;
}

async function makeSchool(opts: { notifications?: boolean } = {}) {
  const handle = unique("school");
  const [user] = await db
    .insert(users)
    .values({
      username: handle,
      email: `${handle}@example.com`,
      role: "user",
      type: "school",
      displayEmail: `${handle}@example.com`,
      firstName: "Test",
      lastName: "School",
      password: "x",
      notifications: opts.notifications ?? true,
    })
    .returning();

  const [school] = await db
    .insert(schoolProfiles)
    .values({ userId: user!.id, name: unique("School Name"), location: "CO" })
    .returning();

  return { user: user!, school: school! };
}

async function makeDancer() {
  const handle = unique("dancer");
  const [user] = await db
    .insert(users)
    .values({
      username: handle,
      email: `${handle}@example.com`,
      role: "user",
      type: "dancer",
      displayEmail: `${handle}@example.com`,
      firstName: "Test",
      lastName: "Dancer",
      password: "x",
    })
    .returning();

  const [dancer] = await db
    .insert(dancerProfiles)
    .values({ userId: user!.id, birthday: "2006-01-01", location: "CO" })
    .returning();

  return dancer!;
}

test.group("findProspectEmailRecipients", (group) => {
  group.each.setup(async () => {
    await db.delete(crvSubmissions).execute();
    await db.delete(dancerProfiles).execute();
    await db.delete(schoolProfiles).execute();
    await db.delete(users).execute();
  });

  test("includes a school with a pending submission", async ({ assert }) => {
    const { school, user } = await makeSchool();
    const dancer = await makeDancer();
    await db
      .insert(crvSubmissions)
      .values({ dancerId: dancer.id, schoolId: school.id, status: "pending" });

    const recipients = await findProspectEmailRecipients();

    assert.lengthOf(recipients, 1);
    assert.equal(recipients[0]!.schoolId, school.id);
    assert.equal(recipients[0]!.email, user.email);
    assert.equal(recipients[0]!.schoolName, school.name);
  });

  test("includes a school with an in_review submission", async ({ assert }) => {
    const { school } = await makeSchool();
    const dancer = await makeDancer();
    await db.insert(crvSubmissions).values({
      dancerId: dancer.id,
      schoolId: school.id,
      status: "in_review",
    });

    const recipients = await findProspectEmailRecipients();
    assert.lengthOf(recipients, 1);
  });

  test("excludes schools whose submissions are all resolved", async ({
    assert,
  }) => {
    const { school } = await makeSchool();
    const accepted = await makeDancer();
    const released = await makeDancer();
    await db.insert(crvSubmissions).values([
      { dancerId: accepted.id, schoolId: school.id, status: "accepted" },
      { dancerId: released.id, schoolId: school.id, status: "released" },
    ]);

    const recipients = await findProspectEmailRecipients();
    assert.isEmpty(recipients);
  });

  test("excludes schools whose user opted out of notifications", async ({
    assert,
  }) => {
    const { school } = await makeSchool({ notifications: false });
    const dancer = await makeDancer();
    await db
      .insert(crvSubmissions)
      .values({ dancerId: dancer.id, schoolId: school.id, status: "pending" });

    const recipients = await findProspectEmailRecipients();
    assert.isEmpty(recipients);
  });

  test("returns one row per school regardless of submission count", async ({
    assert,
  }) => {
    const { school } = await makeSchool();
    const first = await makeDancer();
    const second = await makeDancer();
    await db.insert(crvSubmissions).values([
      { dancerId: first.id, schoolId: school.id, status: "pending" },
      { dancerId: second.id, schoolId: school.id, status: "in_review" },
    ]);

    const recipients = await findProspectEmailRecipients();
    assert.lengthOf(recipients, 1);
  });
});
