import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import {
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
    await db.delete(eventDancerProfiles).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
  });

  test("updates roster-level fields for a pending dancer", async ({
    assert,
  }) => {
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
    const result = await service.execute(event.id, row!.id, {
      firstName: "Alice",
      lastName: "New",
      bibNumber: 2,
    });

    assert.equal(result.firstName, "Alice");
    assert.equal(result.lastName, "New");
    assert.equal(result.bibNumber, 2);
  });

  test("upserts profile fields, inserting when no row exists", async ({
    assert,
  }) => {
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
    const result = await service.execute(event.id, row!.id, {
      profile: {
        gradYear: 2028,
        gpa: 3.5,
        studio: "Studio X",
        danceStyles: ["Jazz"],
      },
    });

    assert.equal(result.profile!.gradYear, 2028);
    assert.equal(result.profile!.gpa, 3.5);
    assert.equal(result.profile!.studio, "Studio X");
    assert.deepEqual(result.profile!.danceStyles, ["Jazz"]);
  });

  test("rejects edits for an active roster entry", async ({ assert }) => {
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
      () => service.execute(event.id, row!.id, { firstName: "Nope" }),
      RosterActiveReadonlyError.prototype.message,
    );
  });

  test("rejects profile field updates for coaches", async ({ assert }) => {
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
        service.execute(event.id, row!.id, {
          profile: { gradYear: 2026 },
        }),
      CoachNoProfileError.prototype.message,
    );
  });

  test("rejects email collision within the same event", async ({ assert }) => {
    const { event } = await makeOrgAndEvent();
    const [_a, b] = await db
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
      () => service.execute(event.id, b!.id, { email: "taken@example.com" }),
      RosterEmailConflictError.prototype.message,
    );
  });

  test("rejects bib collision within the same event", async ({ assert }) => {
    const { event } = await makeOrgAndEvent();
    const [_a, b] = await db
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
      () => service.execute(event.id, b!.id, { bibNumber: 99 }),
      RosterBibConflictError.prototype.message,
    );
  });

  test("allows setting nullable fields to null", async ({ assert }) => {
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
    const result = await service.execute(event.id, row!.id, {
      organization: null,
      bibNumber: null,
    });

    assert.isNull(result.organization);
    assert.isNull(result.bibNumber);
  });
});
