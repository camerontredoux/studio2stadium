import { test } from "@japa/runner";
import { db } from "#database/connection";
import {
  eventCallbacks,
  eventRatings,
  eventShowcases,
  publishedCallbacks,
} from "#database/schema/event-features";
import { organizations } from "#database/schema/organizations";
import { orgEvents, eventRosters } from "#database/schema/org-events";
import { DancerCallbacksService } from "./service.ts";

async function setup() {
  const [org] = await db
    .insert(organizations)
    .values({ name: "Test Org", slug: `test-${Date.now()}` })
    .returning();

  const [event] = await db
    .insert(orgEvents)
    .values({
      orgId: org!.id,
      name: "Test Event",
      startDate: "2026-07-01",
      endDate: "2026-07-02",
      isActive: true,
    })
    .returning();

  return { org: org!, event: event! };
}

async function addShowcase(eventId: string, number: number, status: string) {
  const [row] = await db
    .insert(eventShowcases)
    .values({
      eventId,
      number,
      status,
      publishedAt: status === "published" ? new Date() : null,
    })
    .returning();
  return row!;
}

async function addCoach(eventId: string, name: string) {
  const [roster] = await db
    .insert(eventRosters)
    .values({
      eventId,
      type: "coach",
      email: `${name}@test.co`,
      firstName: name,
      lastName: "Coach",
      organization: `${name} University`,
    })
    .returning();
  return roster!;
}

async function addDancer(eventId: string, bib: number, name: string) {
  const [roster] = await db
    .insert(eventRosters)
    .values({
      eventId,
      type: "dancer",
      email: `dancer${bib}@test.co`,
      firstName: name,
      lastName: "Dancer",
      bibNumber: bib,
    })
    .returning();
  return roster!;
}

test.group("DancerCallbacksService", (group) => {
  group.each.setup(async () => {
    await db.delete(publishedCallbacks).execute();
    await db.delete(eventCallbacks).execute();
    await db.delete(eventRatings).execute();
    await db.delete(eventShowcases).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
  });

  test("returns nothing and flags no published showcase before release", async ({
    assert,
  }) => {
    const { event } = await setup();
    const showcase = await addShowcase(event.id, 1, "active");
    const coach = await addCoach(event.id, "Alice");
    const dancer = await addDancer(event.id, 1, "Dee");

    await db.insert(eventCallbacks).values({
      eventId: event.id,
      showcaseId: showcase.id,
      coachRosterId: coach.id,
      dancerRosterId: dancer.id,
    });

    const result = await new DancerCallbacksService().execute(
      event.id,
      dancer.id
    );

    assert.equal(result.publishedShowcaseCount, 0);
    assert.lengthOf(result.callbacks, 0);
  });

  test("accumulates callbacks across every published showcase", async ({
    assert,
  }) => {
    const { event } = await setup();
    const first = await addShowcase(event.id, 1, "published");
    const second = await addShowcase(event.id, 2, "published");
    const earlyCoach = await addCoach(event.id, "Early");
    const lateCoach = await addCoach(event.id, "Late");
    const dancer = await addDancer(event.id, 1, "Dee");

    await db.insert(publishedCallbacks).values([
      {
        showcaseId: first.id,
        coachRosterId: earlyCoach.id,
        dancerRosterId: dancer.id,
        rank: 1,
      },
      {
        showcaseId: second.id,
        coachRosterId: lateCoach.id,
        dancerRosterId: dancer.id,
        rank: 1,
      },
    ]);

    const result = await new DancerCallbacksService().execute(
      event.id,
      dancer.id
    );

    assert.equal(result.publishedShowcaseCount, 2);
    assert.lengthOf(result.callbacks, 2);

    // Showcase 1's callback must survive showcase 2 being published.
    const early = result.callbacks.find(
      (cb) => cb.coachRosterId === earlyCoach.id
    );
    assert.isDefined(early);
    assert.deepEqual(early!.showcaseNumbers, [1]);
    assert.equal(early!.organization, "Early University");
  });

  test("collapses a school that called the dancer back in two showcases", async ({
    assert,
  }) => {
    const { event } = await setup();
    const first = await addShowcase(event.id, 1, "published");
    const second = await addShowcase(event.id, 2, "published");
    const coach = await addCoach(event.id, "Loyal");
    const dancer = await addDancer(event.id, 1, "Dee");

    await db.insert(publishedCallbacks).values([
      {
        showcaseId: first.id,
        coachRosterId: coach.id,
        dancerRosterId: dancer.id,
        rank: 1,
      },
      {
        showcaseId: second.id,
        coachRosterId: coach.id,
        dancerRosterId: dancer.id,
        rank: 2,
      },
    ]);

    const result = await new DancerCallbacksService().execute(
      event.id,
      dancer.id
    );

    assert.lengthOf(result.callbacks, 1);
    assert.deepEqual(result.callbacks[0]!.showcaseNumbers, [1, 2]);
    assert.equal(result.callbacks[0]!.firstShowcaseNumber, 1);
  });
});
