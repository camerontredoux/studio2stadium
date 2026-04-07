import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users, platforms } from "#database/schema/users";
import {
  organizations,
  orgMemberships,
} from "#database/schema/organizations";
import { and, eq } from "drizzle-orm";
import { seedOrganizations } from "#commands/backfill_organizations";
import { backfillOrgMemberships } from "#commands/backfill_org_memberships";

test.group("backfill org memberships", (group) => {
  group.each.setup(async () => {
    // Clean slate: delete memberships + platforms + users + orgs in FK order.
    await db.delete(orgMemberships).execute();
    await db.delete(platforms).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();
  });

  test("creates org_memberships rows for every user_platforms row", async ({ assert }) => {
    const [u] = await db
      .insert(users)
      .values({
        username: "dancer1",
        email: "dancer1@example.com",
        role: "user",
        type: "dancer",
        displayEmail: "dancer1@example.com",
        firstName: "D",
        lastName: "One",
        password: "x",
      })
      .returning();
    await db.insert(platforms).values({
      userId: u!.id,
      platformName: "prodigy",
    });

    await backfillOrgMemberships();

    const [prodigy] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "prodigy"));
    const rows = await db
      .select()
      .from(orgMemberships)
      .where(
        and(
          eq(orgMemberships.userId, u!.id),
          eq(orgMemberships.orgId, prodigy!.id)
        )
      );
    assert.lengthOf(rows, 1);
    assert.equal(rows[0]!.type, "dancer");
    assert.equal(rows[0]!.role, "member");
  });

  test("promotes prodigy_admin role users to admin on prodigy org", async ({ assert }) => {
    const [u] = await db
      .insert(users)
      .values({
        username: "padmin",
        email: "padmin@example.com",
        role: "prodigy_admin",
        type: "dancer",
        displayEmail: "padmin@example.com",
        firstName: "P",
        lastName: "Admin",
        password: "x",
      })
      .returning();
    await db.insert(platforms).values({
      userId: u!.id,
      platformName: "prodigy",
    });

    await backfillOrgMemberships();

    const [prodigy] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "prodigy"));
    const [row] = await db
      .select()
      .from(orgMemberships)
      .where(
        and(
          eq(orgMemberships.userId, u!.id),
          eq(orgMemberships.orgId, prodigy!.id)
        )
      );
    assert.equal(row!.role, "admin");
  });

  test("school-type users become coach-type memberships", async ({ assert }) => {
    const [school] = await db
      .insert(users)
      .values({
        username: "school1",
        email: "school1@example.com",
        role: "user",
        type: "school",
        displayEmail: "school1@example.com",
        firstName: "School",
        lastName: "One",
        password: "x",
      })
      .returning();
    await db.insert(platforms).values({
      userId: school!.id,
      platformName: "core",
    });

    await backfillOrgMemberships();

    const [core] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "core"));
    const [row] = await db
      .select()
      .from(orgMemberships)
      .where(
        and(
          eq(orgMemberships.userId, school!.id),
          eq(orgMemberships.orgId, core!.id)
        )
      );
    assert.equal(row!.type, "coach");
    assert.equal(row!.role, "member");
  });

  test("idempotent on repeated runs", async ({ assert }) => {
    const [u] = await db
      .insert(users)
      .values({
        username: "idem",
        email: "idem@example.com",
        role: "user",
        type: "dancer",
        displayEmail: "idem@example.com",
        firstName: "I",
        lastName: "D",
        password: "x",
      })
      .returning();
    await db.insert(platforms).values({
      userId: u!.id,
      platformName: "core",
    });

    await backfillOrgMemberships();
    await backfillOrgMemberships();
    await backfillOrgMemberships();

    const rows = await db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, u!.id));
    assert.lengthOf(rows, 1);
  });
});
