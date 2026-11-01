import { db } from "#database/connection";
import {
  eventAuditLog,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { createDancer, login } from "#tests/helpers/premium";
import { test } from "@japa/runner";
import { eq } from "drizzle-orm";

async function fixture() {
  const [admin, dancer, stranger] = await Promise.all([
    createDancer(),
    createDancer(),
    createDancer(),
  ]);
  const [org] = await db
    .insert(organizations)
    .values({
      name: "Self Check-in Org",
      slug: "self-check-in-org",
      features: { check_in: true },
    })
    .returning();
  // The stranger is an org member with no Roster Entry on the event.
  await db.insert(orgMemberships).values([
    { orgId: org!.id, userId: admin.id, role: "admin", type: "organizer" },
    { orgId: org!.id, userId: dancer.id, role: "member", type: "dancer" },
    { orgId: org!.id, userId: stranger.id, role: "member", type: "dancer" },
  ]);
  const [event] = await db
    .insert(orgEvents)
    .values({
      orgId: org!.id,
      name: "Self Check-in Event",
      startDate: "2026-06-01",
      endDate: "2026-06-02",
      isActive: true,
    })
    .returning();
  const [roster] = await db
    .insert(eventRosters)
    .values({
      eventId: event!.id,
      userId: dancer.id,
      type: "dancer",
      email: dancer.email,
      firstName: "Sally",
      lastName: "Self",
      bibNumber: 7,
    })
    .returning();
  return {
    admin,
    dancer,
    stranger,
    org: org!,
    event: event!,
    roster: roster!,
    eventUrl: `/orgs/${org!.slug}/events/${event!.id}`,
  };
}

test.group("POST /orgs/:slug/events/:id/check-in", (group) => {
  group.each.setup(async () => {
    await db.delete(eventAuditLog);
    await db.delete(organizations);
    await db.delete(users);
  });

  test("once an admin turns self check-in on, a dancer checks themselves in", async ({
    client,
    assert,
  }) => {
    const { admin, dancer, roster, eventUrl } = await fixture();
    const dancerToken = await login(client, dancer.email);

    const before = await client
      .get(`${eventUrl}/check-in/status`)
      .bearerToken(dancerToken);
    assert.isFalse(before.body().selfCheckIn);

    const adminToken = await login(client, admin.email);
    const patch = await client
      .patch(eventUrl)
      .bearerToken(adminToken)
      .json({ selfCheckIn: true });
    patch.assertStatus(200);
    assert.isTrue(patch.body().selfCheckIn);

    const res = await client
      .post(`${eventUrl}/check-in`)
      .bearerToken(dancerToken);
    res.assertStatus(200);
    assert.equal(res.body().result, "checked_in");
    assert.equal(res.body().roster.id, roster.id);

    const status = await client
      .get(`${eventUrl}/check-in/status`)
      .bearerToken(dancerToken);
    assert.isTrue(status.body().selfCheckIn);
    assert.equal(status.body().checkedInAt, res.body().roster.checkedInAt);
    assert.isFalse(status.body().canCheckIn);

    // Audited like a scan, with the dancer as the actor.
    const audit = await db
      .select()
      .from(eventAuditLog)
      .where(eq(eventAuditLog.resourceId, roster.id));
    assert.lengthOf(audit, 1);
    assert.equal(audit[0]!.actorId, dancer.id);
  });

  test("refused while self check-in is off", async ({ client, assert }) => {
    const { dancer, roster, eventUrl } = await fixture();
    const token = await login(client, dancer.email);

    const res = await client.post(`${eventUrl}/check-in`).bearerToken(token);
    res.assertStatus(403);

    const [row] = await db
      .select({ checkedInAt: eventRosters.checkedInAt })
      .from(eventRosters)
      .where(eq(eventRosters.id, roster.id));
    assert.isNull(row!.checkedInAt);
  });

  test("refused for a member who is not on the event's roster", async ({
    client,
  }) => {
    const { stranger, event, eventUrl } = await fixture();
    await db
      .update(orgEvents)
      .set({ selfCheckIn: true })
      .where(eq(orgEvents.id, event.id));
    const token = await login(client, stranger.email);

    const res = await client.post(`${eventUrl}/check-in`).bearerToken(token);
    res.assertStatus(403);
  });
});
