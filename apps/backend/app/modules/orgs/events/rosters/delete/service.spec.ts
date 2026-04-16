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
import { organizations } from "#database/schema/organizations";
import { DeleteRosterService } from "./service.ts";

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

async function makeOrgAndEvent(slug = `t-${Date.now()}-${Math.random()}`) {
  const [org] = await db
    .insert(organizations)
    .values({ name: "T", slug })
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

test.group("DeleteRosterService", (group) => {
  group.each.setup(async () => {
    await db.delete(eventAuditLog).execute();
    await db.delete(eventDancerProfiles).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
  });

  test("bulk deletes rosters by id", async ({ assert }) => {
    const actor = await makeActorUser();
    const { event } = await makeOrgAndEvent();
    const rows = await db
      .insert(eventRosters)
      .values([
        { eventId: event.id, type: "dancer", email: "a@example.com", firstName: "A", lastName: "A" },
        { eventId: event.id, type: "dancer", email: "b@example.com", firstName: "B", lastName: "B" },
        { eventId: event.id, type: "dancer", email: "c@example.com", firstName: "C", lastName: "C" },
      ])
      .returning();

    const service = new DeleteRosterService();
    const result = await service.execute(event.id, {
      ids: [rows[0]!.id, rows[1]!.id],
    }, { eventId: event.id, actorId: actor.id });
    assert.equal(result.deletedCount, 2);

    const remaining = await db.select().from(eventRosters);
    assert.lengthOf(remaining, 1);
    assert.equal(remaining[0]!.email, "c@example.com");
  });

  test("cascades to event_dancer_profiles", async ({ assert }) => {
    const actor = await makeActorUser();
    const { event } = await makeOrgAndEvent();
    const [row] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        type: "dancer",
        email: "p@example.com",
        firstName: "P",
        lastName: "P",
      })
      .returning();
    await db.insert(eventDancerProfiles).values({
      rosterId: row!.id,
      gradYear: 2026,
    });

    const service = new DeleteRosterService();
    await service.execute(event.id, { ids: [row!.id] }, { eventId: event.id, actorId: actor.id });

    const profiles = await db
      .select()
      .from(eventDancerProfiles)
      .where(eq(eventDancerProfiles.rosterId, row!.id));
    assert.lengthOf(profiles, 0);
  });

  test("ignores ids belonging to a different event", async ({ assert }) => {
    const actor = await makeActorUser();
    const { event: eventA } = await makeOrgAndEvent();
    const { event: eventB } = await makeOrgAndEvent();

    const [rowB] = await db
      .insert(eventRosters)
      .values({
        eventId: eventB.id,
        type: "dancer",
        email: "other@example.com",
        firstName: "O",
        lastName: "O",
      })
      .returning();

    const service = new DeleteRosterService();
    const result = await service.execute(eventA.id, { ids: [rowB!.id] }, { eventId: eventA.id, actorId: actor.id });
    assert.equal(result.deletedCount, 0);

    const stillThere = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.id, rowB!.id));
    assert.lengthOf(stillThere, 1);
  });
});
