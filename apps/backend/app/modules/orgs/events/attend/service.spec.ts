import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { AttendEventService } from "./service.ts";
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
    .values({ name: "Test Org", slug: `test-org-${Date.now()}-${Math.random()}` })
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

test.group("AttendEventService", (group) => {
  group.each.setup(async () => {
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
  });

  test("creates an active roster row so an org admin can attend as coach", async ({
    assert,
  }) => {
    const user = await makeAdminUser();
    const { event } = await makeOrgEventAndMembership(user.id);

    const sessionUser: SessionUser = {
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
    };

    const service = new AttendEventService();
    const roster = await service.execute(event.id, sessionUser, "coach");

    assert.equal(roster.eventId, event.id);
    assert.equal(roster.userId, user.id);
    assert.equal(roster.type, "coach");
  });
});
