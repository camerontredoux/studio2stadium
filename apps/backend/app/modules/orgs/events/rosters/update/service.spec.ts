import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import {
  eventAuditLog,
  eventDancerProfiles,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import {
  CoachNoProfileError,
  RosterActiveReadonlyError,
  RosterBibConflictError,
  RosterEmailConflictError,
  UpdateRosterService,
} from "./service.ts";

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
    .values({ name: "T Org", slug: `t-${Date.now()}-${Math.random()}` })
    .returning();
  const [event] = await db
    .insert(orgEvents)
    .values({
      orgId: org!.id,
      name: "T Event",
      startDate: "2026-06-01",
      endDate: "2026-06-02",
    })
    .returning();
  return { org: org!, event: event! };
}

test.group("UpdateRosterService", (group) => {
  group.each.setup(async () => {
    await db.delete(eventAuditLog).execute();
    await db.delete(eventDancerProfiles).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
  });

  test("updates roster-level fields for a pending dancer", async ({
    assert,
  }) => {
    const actor = await makeActorUser();
    const { event } = await makeOrgAndEvent();
    const [row] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        type: "dancer",
        email: "a@example.com",
        firstName: "A",
        lastName: "Old",
        bibNumber: 1,
      })
      .returning();

    const service = new UpdateRosterService();
    const result = await service.execute(
      event.id,
      row!.id,
      {
        firstName: "Alice",
        lastName: "New",
        bibNumber: 2,
      },
      { eventId: event.id, actorId: actor.id }
    );

    assert.equal(result.firstName, "Alice");
    assert.equal(result.lastName, "New");
    assert.equal(result.bibNumber, 2);
  });

  test("upserts profile fields, inserting when no row exists", async ({
    assert,
  }) => {
    const actor = await makeActorUser();
    const { event } = await makeOrgAndEvent();
    const [row] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        type: "dancer",
        email: "b@example.com",
        firstName: "B",
        lastName: "Row",
      })
      .returning();

    const service = new UpdateRosterService();
    const result = await service.execute(
      event.id,
      row!.id,
      {
        profile: {
          gradYear: 2028,
          gpa: 3.5,
        },
      },
      { eventId: event.id, actorId: actor.id }
    );

    assert.equal(result.profile!.gradYear, 2028);
    assert.equal(result.profile!.gpa, 3.5);
  });

  test("rejects edits for an active roster entry", async ({ assert }) => {
    const actor = await makeActorUser();
    const { event } = await makeOrgAndEvent();
    const [user] = await db
      .insert(users)
      .values({
        username: `u_${Date.now()}_${Math.random()}`,
        email: "active@example.com",
        displayEmail: "active@example.com",
        firstName: "Act",
        lastName: "Ive",
        password: "hashed",
        role: "user",
        type: "dancer",
      })
      .returning();
    const [row] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        type: "dancer",
        email: "active@example.com",
        firstName: "Act",
        lastName: "Ive",
        userId: user!.id,
      })
      .returning();

    const service = new UpdateRosterService();
    await assert.rejects(
      () =>
        service.execute(
          event.id,
          row!.id,
          { firstName: "Nope" },
          { eventId: event.id, actorId: actor.id }
        ),
      RosterActiveReadonlyError.prototype.message
    );
  });

  test("rejects profile field updates for coaches", async ({ assert }) => {
    const actor = await makeActorUser();
    const { event } = await makeOrgAndEvent();
    const [row] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        type: "coach",
        email: "coach@example.com",
        firstName: "Head",
        lastName: "Coach",
      })
      .returning();

    const service = new UpdateRosterService();
    await assert.rejects(
      () =>
        service.execute(
          event.id,
          row!.id,
          {
            profile: { gradYear: 2026 },
          },
          { eventId: event.id, actorId: actor.id }
        ),
      CoachNoProfileError.prototype.message
    );
  });

  test("rejects email collision within the same event", async ({ assert }) => {
    const actor = await makeActorUser();
    const { event } = await makeOrgAndEvent();
    const [, b] = await db
      .insert(eventRosters)
      .values([
        {
          eventId: event.id,
          type: "dancer",
          email: "taken@example.com",
          firstName: "A",
          lastName: "A",
        },
        {
          eventId: event.id,
          type: "dancer",
          email: "free@example.com",
          firstName: "B",
          lastName: "B",
        },
      ])
      .returning();

    const service = new UpdateRosterService();
    await assert.rejects(
      () =>
        service.execute(
          event.id,
          b!.id,
          { email: "taken@example.com" },
          { eventId: event.id, actorId: actor.id }
        ),
      RosterEmailConflictError.prototype.message
    );
  });

  test("rejects bib collision within the same event", async ({ assert }) => {
    const actor = await makeActorUser();
    const { event } = await makeOrgAndEvent();
    const [, b] = await db
      .insert(eventRosters)
      .values([
        {
          eventId: event.id,
          type: "dancer",
          email: "x@example.com",
          firstName: "X",
          lastName: "X",
          bibNumber: 99,
        },
        {
          eventId: event.id,
          type: "dancer",
          email: "y@example.com",
          firstName: "Y",
          lastName: "Y",
          bibNumber: 100,
        },
      ])
      .returning();

    const service = new UpdateRosterService();
    await assert.rejects(
      () =>
        service.execute(
          event.id,
          b!.id,
          { bibNumber: 99 },
          { eventId: event.id, actorId: actor.id }
        ),
      RosterBibConflictError.prototype.message
    );
  });

  test("allows setting nullable fields to null", async ({ assert }) => {
    const actor = await makeActorUser();
    const { event } = await makeOrgAndEvent();
    const [row] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        type: "dancer",
        email: "z@example.com",
        firstName: "Z",
        lastName: "Z",
        organization: "Old Org",
        bibNumber: 50,
      })
      .returning();

    const service = new UpdateRosterService();
    const result = await service.execute(
      event.id,
      row!.id,
      {
        organization: null,
        bibNumber: null,
      },
      { eventId: event.id, actorId: actor.id }
    );

    assert.isNull(result.organization);
    assert.isNull(result.bibNumber);
  });
});
