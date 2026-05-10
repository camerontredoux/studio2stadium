import { test } from "@japa/runner";
import { db } from "#database/connection";
import {
  eventDancerProfiles,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { FiltersRosterService } from "./service.ts";

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

test.group("FiltersRosterService", (group) => {
  group.each.setup(async () => {
    await db.delete(eventDancerProfiles).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(organizations).execute();
  });

  test("returns distinct sorted organizations for the given type", async ({
    assert,
  }) => {
    const { event } = await makeOrgAndEvent();
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "a@example.com",
        firstName: "A",
        lastName: "A",
        organization: "Zeta Studio",
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "b@example.com",
        firstName: "B",
        lastName: "B",
        organization: "Alpha Studio",
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "c@example.com",
        firstName: "C",
        lastName: "C",
        organization: "Alpha Studio",
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "d@example.com",
        firstName: "D",
        lastName: "D",
        organization: null,
      },
      {
        eventId: event.id,
        type: "coach",
        email: "e@example.com",
        firstName: "E",
        lastName: "E",
        organization: "Coach School",
      },
    ]);

    const service = new FiltersRosterService();
    const dancerResult = await service.execute(event.id, { type: "dancer" });
    assert.deepEqual(dancerResult.organizations, [
      "Alpha Studio",
      "Zeta Studio",
    ]);

    const coachResult = await service.execute(event.id, { type: "coach" });
    assert.deepEqual(coachResult.organizations, ["Coach School"]);
  });

  test("returns empty array when no rosters exist", async ({ assert }) => {
    const { event } = await makeOrgAndEvent();
    const service = new FiltersRosterService();
    const result = await service.execute(event.id, { type: "dancer" });
    assert.deepEqual(result.organizations, []);
  });
});
