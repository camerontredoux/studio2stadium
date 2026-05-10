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

  test("skips coaches, active dancers, and unknown ids", async ({ assert }) => {
    const actor = await makeActorUser();
    const { org, event } = await makeOrgAndEvent();
    const [user] = await db
      .insert(users)
      .values({
        username: `u_${Date.now()}_${Math.random()}`,
        email: "active@example.com",
        displayEmail: "active@example.com",
        firstName: "Act",
        lastName: "Ive",
        password: "h",
        role: "user",
        type: "dancer",
      })
      .returning();
    const rows = await db
      .insert(eventRosters)
      .values([
        {
          eventId: event.id,
          type: "dancer",
          email: "active@example.com",
          firstName: "Act",
          lastName: "Ive",
          userId: user!.id,
        },
        {
          eventId: event.id,
          type: "coach",
          email: "coach@example.com",
          firstName: "C",
          lastName: "C",
        },
        {
          eventId: event.id,
          type: "dancer",
          email: "pending@example.com",
          firstName: "P",
          lastName: "P",
        },
      ])
      .returning();

    const service = new ResendInvitesService();
    const result = await service.execute(
      org.slug,
      event.id,
      {
        ids: [
          rows[0]!.id, // active dancer
          rows[1]!.id, // coach
          rows[2]!.id, // pending dancer
          "00000000-0000-0000-0000-000000000000", // unknown
        ],
      },
      { eventId: event.id, actorId: actor.id },
      { pacingMs: 0 }
    );

    assert.equal(result.sent, 1);
    assert.equal(result.skipped, 3);
  });
});
