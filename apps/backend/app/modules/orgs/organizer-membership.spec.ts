import { db } from "#database/connection";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { seedOrganizations } from "#commands/backfill-organizations";
import { nonOrganizerMembershipConflict } from "#shared/org/membership";
import { test } from "@japa/runner";
import { and, eq, sql } from "drizzle-orm";

/**
 * The invariants ADR 0003 puts on `organizer`. The enum value is cheap; these
 * are the things that would quietly break if a later change treated an org
 * member type as "coach or dancer".
 */
test.group("organizer membership", (group) => {
  let orgId: string;
  let userId: string;

  group.each.setup(async () => {
    await db.delete(organizations).execute();
    await seedOrganizations();
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    orgId = org!.id;

    const stamp = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const [user] = await db
      .insert(users)
      .values({
        username: `organizer_${stamp}`,
        email: `organizer_${stamp}@example.com`,
        firstName: "Ora",
        lastName: "Ganiser",
        displayEmail: `organizer_${stamp}@example.com`,
        password: "hashed",
        role: "user",
        type: "school",
      })
      .returning();
    userId = user!.id;
  });

  test("an organizer membership can be created", async ({ assert }) => {
    const [membership] = await db
      .insert(orgMemberships)
      .values({ userId, orgId, type: "organizer", role: "member" })
      .returning();

    assert.equal(membership!.type, "organizer");
  });

  test("the same person can hold both an organizer and a coach membership", async ({
    assert,
  }) => {
    await db
      .insert(orgMemberships)
      .values({ userId, orgId, type: "organizer", role: "member" });
    await db
      .insert(orgMemberships)
      .values({ userId, orgId, type: "coach", role: "member" });

    const held = await db
      .select({ type: orgMemberships.type })
      .from(orgMemberships)
      .where(
        and(eq(orgMemberships.userId, userId), eq(orgMemberships.orgId, orgId))
      );

    assert.sameMembers(
      held.map((m) => m.type),
      ["organizer", "coach"]
    );
  });

  test("coach and dancer stay mutually exclusive, as before organizer existed", async ({
    assert,
  }) => {
    await db
      .insert(orgMemberships)
      .values({ userId, orgId, type: "coach", role: "member" });

    await assert.rejects(() =>
      db
        .insert(orgMemberships)
        .values({ userId, orgId, type: "dancer", role: "member" })
        .then(() => undefined)
    );
  });

  test("a second organizer membership is rejected", async ({ assert }) => {
    await db
      .insert(orgMemberships)
      .values({ userId, orgId, type: "organizer", role: "member" });

    await assert.rejects(() =>
      db
        .insert(orgMemberships)
        .values({ userId, orgId, type: "organizer", role: "admin" })
        .then(() => undefined)
    );
  });

  test("upserting a coach membership leaves an existing organizer one alone", async ({
    assert,
  }) => {
    await db
      .insert(orgMemberships)
      .values({ userId, orgId, type: "organizer", role: "member" });

    // The shape every roster/invite flow uses to grant participant membership.
    await db
      .insert(orgMemberships)
      .values({ userId, orgId, type: "coach", role: "member" })
      .onConflictDoNothing(nonOrganizerMembershipConflict());
    await db
      .insert(orgMemberships)
      .values({ userId, orgId, type: "coach", role: "member" })
      .onConflictDoNothing(nonOrganizerMembershipConflict());

    const held = await db
      .select({ type: orgMemberships.type })
      .from(orgMemberships)
      .where(
        and(eq(orgMemberships.userId, userId), eq(orgMemberships.orgId, orgId))
      );

    assert.sameMembers(
      held.map((m) => m.type),
      ["organizer", "coach"]
    );
  });

  test("an organizer can never become a roster entry", async ({ assert }) => {
    const [event] = await db
      .insert(orgEvents)
      .values({
        orgId,
        name: "Organizer Invariant Event",
        startDate: "2030-01-01",
        endDate: "2030-01-02",
      })
      .returning();

    // Bypasses the TypeScript narrowing on `event_rosters.type` on purpose:
    // the database must refuse this even if application code ever slips.
    await assert.rejects(() =>
      db
        .execute(
          sql`insert into ${eventRosters} (event_id, type, email, first_name, last_name)
              values (${event!.id}, 'organizer', 'ora@example.com', 'Ora', 'Ganiser')`
        )
        .then(() => undefined)
    );
  });
});
