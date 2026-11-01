import { db } from "#database/connection";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { seedOrganizations } from "#commands/backfill-organizations";
import { backfillOrganizers } from "#commands/backfill-organizers";
import { test } from "@japa/runner";
import { and, eq } from "drizzle-orm";

test.group("backfill organizers", (group) => {
  let orgId: string;
  let eventId: string;
  let seq = 0;

  group.each.setup(async () => {
    await db.delete(organizations).execute();
    await seedOrganizations();
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    orgId = org!.id;

    const [event] = await db
      .insert(orgEvents)
      .values({
        orgId,
        name: "Backfill Event",
        startDate: "2030-01-01",
        endDate: "2030-01-02",
      })
      .returning();
    eventId = event!.id;
  });

  async function makeUser() {
    seq += 1;
    const stamp = `${Date.now()}_${seq}`;
    const [user] = await db
      .insert(users)
      .values({
        username: `bf_${stamp}`,
        email: `bf_${stamp}@example.com`,
        displayEmail: `bf_${stamp}@example.com`,
        firstName: "Back",
        lastName: "Fill",
        password: "hashed",
        role: "user",
        type: "school",
      })
      .returning();
    return user!;
  }

  const typeOf = async (userId: string) => {
    const rows = await db
      .select({ type: orgMemberships.type })
      .from(orgMemberships)
      .where(
        and(eq(orgMemberships.userId, userId), eq(orgMemberships.orgId, orgId))
      );
    return rows.map((r) => r.type).sort();
  };

  test("reclassifies an admin coach who is on no roster", async ({
    assert,
  }) => {
    const user = await makeUser();
    await db
      .insert(orgMemberships)
      .values({ userId: user.id, orgId, type: "coach", role: "admin" });

    const dry = await backfillOrganizers({ orgSlug: "summit" });
    assert.equal(dry.reclassified, 0);
    assert.deepEqual(
      await typeOf(user.id),
      ["coach"],
      "dry run must not write"
    );
    assert.equal(dry.candidates[0]?.verdict, "reclassify");

    const applied = await backfillOrganizers({
      apply: true,
      orgSlug: "summit",
    });
    assert.equal(applied.reclassified, 1);
    assert.deepEqual(await typeOf(user.id), ["organizer"]);
  });

  test("leaves an admin coach who holds a real roster entry", async ({
    assert,
  }) => {
    const user = await makeUser();
    await db
      .insert(orgMemberships)
      .values({ userId: user.id, orgId, type: "coach", role: "admin" });
    await db.insert(eventRosters).values({
      eventId,
      userId: user.id,
      type: "coach",
      email: user.email,
      firstName: "Back",
      lastName: "Fill",
    });

    const result = await backfillOrganizers({ apply: true, orgSlug: "summit" });

    assert.equal(result.reclassified, 0);
    assert.equal(result.candidates[0]?.verdict, "coaches-too");
    assert.deepEqual(await typeOf(user.id), ["coach"]);
  });

  test("a view-as preview roster is not evidence of coaching", async ({
    assert,
  }) => {
    const user = await makeUser();
    await db
      .insert(orgMemberships)
      .values({ userId: user.id, orgId, type: "coach", role: "admin" });
    await db.insert(eventRosters).values({
      eventId,
      userId: user.id,
      type: "coach",
      email: user.email,
      firstName: "Back",
      lastName: "Fill",
      isStaff: true,
    });

    const result = await backfillOrganizers({ apply: true, orgSlug: "summit" });

    assert.equal(result.reclassified, 1);
    assert.equal(result.candidates[0]?.previewRosters, 1);
    assert.deepEqual(await typeOf(user.id), ["organizer"]);
  });

  test("never touches a plain coach member", async ({ assert }) => {
    const user = await makeUser();
    await db
      .insert(orgMemberships)
      .values({ userId: user.id, orgId, type: "coach", role: "member" });

    const result = await backfillOrganizers({ apply: true, orgSlug: "summit" });

    assert.lengthOf(result.candidates, 0);
    assert.deepEqual(await typeOf(user.id), ["coach"]);
  });

  test("skips someone who already holds an organizer membership", async ({
    assert,
  }) => {
    const user = await makeUser();
    await db.insert(orgMemberships).values([
      { userId: user.id, orgId, type: "coach", role: "admin" },
      { userId: user.id, orgId, type: "organizer", role: "member" },
    ]);

    const result = await backfillOrganizers({ apply: true, orgSlug: "summit" });

    assert.equal(result.reclassified, 0);
    assert.equal(result.candidates[0]?.verdict, "already-organizer");
    assert.deepEqual(await typeOf(user.id), ["coach", "organizer"]);
  });

  test("is idempotent", async ({ assert }) => {
    const user = await makeUser();
    await db
      .insert(orgMemberships)
      .values({ userId: user.id, orgId, type: "coach", role: "admin" });

    await backfillOrganizers({ apply: true, orgSlug: "summit" });
    const second = await backfillOrganizers({ apply: true, orgSlug: "summit" });

    assert.lengthOf(second.candidates, 0);
    assert.deepEqual(await typeOf(user.id), ["organizer"]);
  });
});
