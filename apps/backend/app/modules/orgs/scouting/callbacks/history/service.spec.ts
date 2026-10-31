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
import { CallbackHistoryService } from "./service.ts";

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

  return { event: event! };
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

test.group("CallbackHistoryService", (group) => {
  group.each.setup(async () => {
    await db.delete(publishedCallbacks).execute();
    await db.delete(eventCallbacks).execute();
    await db.delete(eventRatings).execute();
    await db.delete(eventShowcases).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
  });

  test("lists the current showcase first, then what each published one sent", async ({
    assert,
  }) => {
    const { event } = await setup();
    const first = await addShowcase(event.id, 1, "published");
    const second = await addShowcase(event.id, 2, "published");
    const current = await addShowcase(event.id, 3, "active");
    const coach = await addCoach(event.id, "Alice");
    const jane = await addDancer(event.id, 122, "Jane");
    const jason = await addDancer(event.id, 125, "Jason");
    const mary = await addDancer(event.id, 126, "Mary");

    await db.insert(eventCallbacks).values({
      eventId: event.id,
      showcaseId: current.id,
      coachRosterId: coach.id,
      dancerRosterId: jane.id,
    });
    // Mary outranked Jason when showcase 2 was published.
    await db.insert(publishedCallbacks).values([
      {
        showcaseId: second.id,
        coachRosterId: coach.id,
        dancerRosterId: jason.id,
        rank: 2,
      },
      {
        showcaseId: second.id,
        coachRosterId: coach.id,
        dancerRosterId: mary.id,
        rank: 1,
      },
    ]);
    await db.insert(eventRatings).values({
      eventId: event.id,
      coachRosterId: coach.id,
      dancerRosterId: mary.id,
      rating: 4,
    });

    const result = await new CallbackHistoryService().execute(
      event.id,
      coach.id
    );

    assert.deepEqual(
      result.showcases.map((s) => [s.number, s.isCurrent]),
      [
        [3, true],
        [2, false],
        [1, false],
      ]
    );
    assert.deepEqual(
      result.showcases[0]!.callbacks.map((c) => c.bibNumber),
      [122]
    );
    assert.deepEqual(
      result.showcases[1]!.callbacks.map((c) => [c.bibNumber, c.rating]),
      [
        [126, 4],
        [125, null],
      ]
    );
    assert.equal(result.showcases[2]!.id, first.id);
    assert.lengthOf(result.showcases[2]!.callbacks, 0);
  });

  test("shows only the asking coach's callbacks and ratings", async ({
    assert,
  }) => {
    const { event } = await setup();
    const past = await addShowcase(event.id, 1, "published");
    const current = await addShowcase(event.id, 2, "active");
    const alice = await addCoach(event.id, "Alice");
    const bob = await addCoach(event.id, "Bob");
    const dancer = await addDancer(event.id, 230, "Juna");

    await db.insert(eventCallbacks).values({
      eventId: event.id,
      showcaseId: current.id,
      coachRosterId: bob.id,
      dancerRosterId: dancer.id,
    });
    await db.insert(publishedCallbacks).values([
      {
        showcaseId: past.id,
        coachRosterId: alice.id,
        dancerRosterId: dancer.id,
        rank: 1,
      },
      {
        showcaseId: past.id,
        coachRosterId: bob.id,
        dancerRosterId: dancer.id,
        rank: 1,
      },
    ]);
    await db.insert(eventRatings).values({
      eventId: event.id,
      coachRosterId: bob.id,
      dancerRosterId: dancer.id,
      rating: 5,
    });

    const result = await new CallbackHistoryService().execute(
      event.id,
      alice.id
    );

    assert.lengthOf(result.showcases[0]!.callbacks, 0);
    assert.deepEqual(result.showcases[1]!.callbacks, [
      {
        rosterId: dancer.id,
        bibNumber: 230,
        firstName: "Juna",
        lastName: "Dancer",
        profilePhotoUrl: null,
        studio: null,
        rating: null,
      },
    ]);
  });

  test("returns no showcases for an event that has none", async ({
    assert,
  }) => {
    const { event } = await setup();
    const coach = await addCoach(event.id, "Alice");

    const result = await new CallbackHistoryService().execute(
      event.id,
      coach.id
    );

    assert.deepEqual(result, { showcases: [] });
  });
});
