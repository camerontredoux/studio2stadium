import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { ViewAsService } from "./service.ts";
import type { SessionUser } from "#auth/provider";

async function makeAdminUser() {
  const ts = `${Date.now()}_${Math.random()}`;
  const [user] = await db
    .insert(users)
    .values({
      username: `event_admin_${ts}`,
      email: `event_admin_${ts}@example.com`,
      displayEmail: `event_admin_${ts}@example.com`,
      firstName: "Event",
      lastName: "Admin",
      password: "hashed",
      role: "user",
      type: "dancer",
      verified: true,
    })
    .returning();
  return user!;
}

async function makeOrgEventAndMembership(userId: string) {
  const [org] = await db
    .insert(organizations)
    .values({
      name: "Test Org",
      slug: `test-org-${Date.now()}-${Math.random()}`,
    })
    .returning();

  await db.insert(orgMemberships).values({
    userId,
    orgId: org!.id,
    role: "admin",
    type: "coach",
  });

  const [event] = await db
    .insert(orgEvents)
    .values({
      orgId: org!.id,
      name: "Active Event",
      startDate: "2026-07-01",
      endDate: "2026-07-02",
      isActive: true,
    })
    .returning();

  return { event: event!, org: org! };
}

function toSessionUser(
  user: Awaited<ReturnType<typeof makeAdminUser>>
): SessionUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    displayEmail: user.displayEmail,
    username: user.username,
    avatar: null,
    type: user.type,
    role: user.role,
    verified: user.verified,
    notifications: user.notifications,
    profileId: undefined,
    platforms: [],
    orgMemberships: [],
    orgAccountTier: null,
  };
}

test.group("ViewAsService", (group) => {
  group.each.setup(async () => {
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
  });

  test("provisions a staff (is_staff) roster for an admin viewing as coach", async ({
    assert,
  }) => {
    const user = await makeAdminUser();
    const { event } = await makeOrgEventAndMembership(user.id);

    const roster = await new ViewAsService().execute(
      event.id,
      toSessionUser(user),
      "coach"
    );

    assert.equal(roster.eventId, event.id);
    assert.equal(roster.userId, user.id);
    assert.equal(roster.type, "coach");
    assert.isTrue(roster.isStaff);
  });

  test("is idempotent — repeated calls return the same staff roster", async ({
    assert,
  }) => {
    const user = await makeAdminUser();
    const { event } = await makeOrgEventAndMembership(user.id);
    const sessionUser = toSessionUser(user);
    const service = new ViewAsService();

    const first = await service.execute(event.id, sessionUser, "coach");
    const second = await service.execute(event.id, sessionUser, "coach");

    assert.equal(first.id, second.id);
  });

  test("coach and dancer staff rosters coexist for the same admin", async ({
    assert,
  }) => {
    const user = await makeAdminUser();
    const { event } = await makeOrgEventAndMembership(user.id);
    const sessionUser = toSessionUser(user);
    const service = new ViewAsService();

    const coach = await service.execute(event.id, sessionUser, "coach");
    const dancer = await service.execute(event.id, sessionUser, "dancer");

    assert.notEqual(coach.id, dancer.id);
    assert.equal(coach.type, "coach");
    assert.equal(dancer.type, "dancer");
    assert.isTrue(coach.isStaff);
    assert.isTrue(dancer.isStaff);
  });
});
