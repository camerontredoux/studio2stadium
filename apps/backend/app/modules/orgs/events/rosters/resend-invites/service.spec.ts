import { test } from "@japa/runner";
import { eq } from "drizzle-orm";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import {
  eventAuditLog,
  eventDancerProfiles,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { dancerInvites, organizations } from "#database/schema/organizations";
import { schoolInvites } from "#database/schema/schools";
import mail from "@adonisjs/mail/services/main";
import { ResendInvitesService } from "./service.ts";

async function makeActorUser() {
  const ts = `${Date.now()}_${Math.random()}`;
  const [actor] = await db
    .insert(users)
    .values({
      username: `actor_${ts}`,
      email: `actor_${ts}@example.com`,
      displayEmail: `actor_${ts}@example.com`,
      firstName: "Actor",
      lastName: "User",
      password: "h",
      role: "admin",
      type: "dancer",
    })
    .returning();
  return actor!;
}

async function makeOrgAndEvent() {
  const [org] = await db
    .insert(organizations)
    .values({ name: "T", slug: `t-${Date.now()}-${Math.random()}` })
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
  return { org: org!, event: event! };
}

test.group("ResendInvitesService", (group) => {
  group.each.setup(async () => {
    await db.delete(eventAuditLog).execute();
    await db.delete(eventDancerProfiles).execute();
    await db.delete(eventRosters).execute();
    await db.delete(schoolInvites).execute();
    await db.delete(orgEvents).execute();
    await db.delete(dancerInvites).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    mail.fake();
  });

  group.each.teardown(() => {
    mail.restore();
  });

  test("regenerates tokens and sends emails for pending dancers", async ({
    assert,
  }) => {
    const actor = await makeActorUser();
    const { org, event } = await makeOrgAndEvent();
    const rows = await db
      .insert(eventRosters)
      .values([
        {
          eventId: event.id,
          type: "dancer",
          email: "a@example.com",
          firstName: "A",
          lastName: "A",
        },
        {
          eventId: event.id,
          type: "dancer",
          email: "b@example.com",
          firstName: "B",
          lastName: "B",
        },
      ])
      .returning();
    // Pre-existing stale invite for a@
    await db.insert(dancerInvites).values({
      orgId: org.id,
      email: "a@example.com",
      token: "old_token_should_be_deleted",
      expiresAt: new Date(Date.now() + 1000),
    });

    const service = new ResendInvitesService();
    const result = await service.execute(
      org.slug,
      event.id,
      { ids: rows.map((r) => r.id) },
      { eventId: event.id, actorId: actor.id },
      { pacingMs: 0 }
    );

    assert.equal(result.sent, 2);
    assert.equal(result.skipped, 0);
    assert.lengthOf(result.failed, 0);

    // Old invite should be gone
    const oldInvites = await db
      .select()
      .from(dancerInvites)
      .where(eq(dancerInvites.token, "old_token_should_be_deleted"));
    assert.lengthOf(oldInvites, 0);

    // New invites should exist
    const newInvites = await db
      .select()
      .from(dancerInvites)
      .where(eq(dancerInvites.orgId, org.id));
    assert.lengthOf(newInvites, 2);
  });

  test("reissues a fresh unconsumed invite for a pending coach", async ({
    assert,
  }) => {
    const actor = await makeActorUser();
    const { org, event } = await makeOrgAndEvent();
    const [coach] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        type: "coach",
        email: "coach@example.com",
        firstName: "Coach",
        lastName: "Pending",
        organization: "Example University",
      })
      .returning();
    const oldExpiresAt = new Date(Date.now() - 86400000);
    await db.insert(schoolInvites).values({
      eventId: event.id,
      email: coach!.email,
      organization: coach!.organization,
      token: "old_coach_token",
      expiresAt: oldExpiresAt,
      consumedAt: new Date(),
    });

    const service = new ResendInvitesService();
    const result = await service.execute(
      org.slug,
      event.id,
      { ids: [coach!.id] },
      { eventId: event.id, actorId: actor.id },
      { pacingMs: 0 }
    );

    assert.equal(result.sent, 1);
    assert.equal(result.skipped, 0);
    assert.lengthOf(result.failed, 0);

    const invites = await db
      .select()
      .from(schoolInvites)
      .where(eq(schoolInvites.eventId, event.id));
    assert.lengthOf(invites, 1);
    assert.notEqual(invites[0]!.token, "old_coach_token");
    assert.isNull(invites[0]!.consumedAt);
    assert.isAbove(invites[0]!.expiresAt.getTime(), Date.now() + 13 * 86400000);
  });

  test("skips a registered coach", async ({ assert }) => {
    const actor = await makeActorUser();
    const { org, event } = await makeOrgAndEvent();
    const [user] = await db
      .insert(users)
      .values({
        username: `u_${Date.now()}_${Math.random()}`,
        email: "registered-coach@example.com",
        displayEmail: "registered-coach@example.com",
        firstName: "Registered",
        lastName: "Coach",
        password: "h",
        role: "user",
        type: "school",
      })
      .returning();
    const [coach] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        type: "coach",
        email: user!.email,
        firstName: user!.firstName,
        lastName: user!.lastName,
        userId: user!.id,
      })
      .returning();

    const service = new ResendInvitesService();
    const result = await service.execute(
      org.slug,
      event.id,
      { ids: [coach!.id] },
      { eventId: event.id, actorId: actor.id },
      { pacingMs: 0 }
    );

    assert.equal(result.sent, 0);
    assert.equal(result.skipped, 1);
    assert.lengthOf(result.failed, 0);

    const invites = await db
      .select()
      .from(schoolInvites)
      .where(eq(schoolInvites.eventId, event.id));
    assert.lengthOf(invites, 0);
  });

  test("resends dancer and coach invites in a mixed batch", async ({
    assert,
  }) => {
    const actor = await makeActorUser();
    const { org, event } = await makeOrgAndEvent();
    const rows = await db
      .insert(eventRosters)
      .values([
        {
          eventId: event.id,
          type: "dancer",
          email: "mixed-dancer@example.com",
          firstName: "Mixed",
          lastName: "Dancer",
        },
        {
          eventId: event.id,
          type: "coach",
          email: "mixed-coach@example.com",
          firstName: "Mixed",
          lastName: "Coach",
          organization: "Mixed University",
        },
      ])
      .returning();

    const service = new ResendInvitesService();
    const result = await service.execute(
      org.slug,
      event.id,
      { ids: rows.map((row) => row.id) },
      { eventId: event.id, actorId: actor.id },
      { pacingMs: 0 }
    );

    assert.equal(result.sent, 2);
    assert.equal(result.skipped, 0);
    assert.lengthOf(result.failed, 0);

    const dancerRows = await db
      .select()
      .from(dancerInvites)
      .where(eq(dancerInvites.email, "mixed-dancer@example.com"));
    const coachRows = await db
      .select()
      .from(schoolInvites)
      .where(eq(schoolInvites.email, "mixed-coach@example.com"));
    assert.lengthOf(dancerRows, 1);
    assert.lengthOf(coachRows, 1);
    assert.isNull(coachRows[0]!.consumedAt);
  });
});
