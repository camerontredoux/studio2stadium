import { test } from "@japa/runner";
import { db } from "#database/connection";
import { orgEvents } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import {
  schoolApplications,
  schoolInvites,
  schoolProfiles,
} from "#database/schema/schools";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { like } from "drizzle-orm";
import { Service } from "./service.ts";

const PREFIX = "unsubmitted-";

let seq = 0;
async function makeSchool(opts: { verified?: boolean } = {}) {
  seq += 1;
  const handle = `${PREFIX}${Date.now()}-${seq}`;
  const [user] = await db
    .insert(users)
    .values({
      username: handle,
      email: `${handle}@example.com`,
      displayEmail: `${handle}@example.com`,
      firstName: "Test",
      lastName: "School",
      password: "x",
      role: "user",
      type: "school",
      verified: opts.verified ?? false,
    })
    .returning();
  const [school] = await db
    .insert(schoolProfiles)
    .values({ userId: user!.id, name: handle, location: "NY" })
    .returning();
  return { user: user!, school: school! };
}

async function consumeInvite(email: string) {
  const [org] = await db
    .insert(organizations)
    .values({ name: "T", slug: `${PREFIX}${Date.now()}-${Math.random()}` })
    .returning();
  const [event] = await db
    .insert(orgEvents)
    .values({
      orgId: org!.id,
      name: "E",
      startDate: "2026-06-01",
      endDate: "2026-06-02",
    })
    .returning();
  await db.insert(schoolInvites).values({
    eventId: event!.id,
    email: email.toUpperCase(),
    token: `${PREFIX}${Date.now()}-${Math.random()}`,
    expiresAt: new Date(Date.now() + 86_400_000),
    consumedAt: new Date(),
  });
}

async function listedIds() {
  const rows = await new Service(new DatabaseService()).execute();
  return rows.map((row) => row.id);
}

test.group("Service (get-unsubmitted-schools)", (group) => {
  group.each.setup(async () => {
    // Scoped to this file's rows; other suites share this database.
    await db
      .delete(users)
      .where(like(users.username, `${PREFIX}%`))
      .execute();
    await db
      .delete(organizations)
      .where(like(organizations.slug, `${PREFIX}%`))
      .execute();
  });

  test("lists an unverified school with no application", async ({ assert }) => {
    const { user, school } = await makeSchool();

    const rows = await new Service(new DatabaseService()).execute();
    const row = rows.find((r) => r.id === school.id);

    assert.deepEqual(row, {
      id: school.id,
      name: school.name,
      location: "NY",
      email: user.email,
      firstName: "Test",
      lastName: "School",
      signedUpAt: user.createdAt,
    });
  });

  test("excludes a school that submitted an application", async ({
    assert,
  }) => {
    const { school } = await makeSchool();
    await db
      .insert(schoolApplications)
      .values({ schoolId: school.id, mediaId: "media" });

    assert.notInclude(await listedIds(), school.id);
  });

  test("excludes a verified school", async ({ assert }) => {
    const { school } = await makeSchool({ verified: true });

    assert.notInclude(await listedIds(), school.id);
  });

  test("excludes a school created from a consumed Org invite", async ({
    assert,
  }) => {
    const { user, school } = await makeSchool();
    await consumeInvite(user.email);

    assert.notInclude(await listedIds(), school.id);
  });

  test("orders the newest signup first", async ({ assert }) => {
    const older = await makeSchool();
    const newer = await makeSchool();

    const listed = await listedIds();
    const ids = listed.filter(
      (id) => id === older.school.id || id === newer.school.id
    );

    assert.deepEqual(ids, [newer.school.id, older.school.id]);
  });
});
