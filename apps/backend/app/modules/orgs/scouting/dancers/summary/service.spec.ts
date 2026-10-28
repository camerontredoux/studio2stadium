import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { organizations, orgMemberships } from "#database/schema/organizations";
import {
  orgEvents,
  eventRosters,
  eventDancerProfiles,
} from "#database/schema/org-events";
import {
  eventFavorites,
  eventNotes,
  eventRatings,
  eventSchoolSelections,
} from "#database/schema/event-features";
import { seedOrganizations } from "#commands/backfill-organizations";
import { eq } from "drizzle-orm";
import { SummarizeDancersService } from "./service.ts";

test.group("SummarizeDancersService", (group) => {
  let summit: typeof organizations.$inferSelect;
  let event: typeof orgEvents.$inferSelect;

  group.each.setup(async () => {
    await db.delete(eventFavorites).execute();
    await db.delete(eventNotes).execute();
    await db.delete(eventSchoolSelections).execute();
    await db.delete(eventRatings).execute();
    await db.delete(eventDancerProfiles).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();
    [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    const [ev] = await db
      .insert(orgEvents)
      .values({
        orgId: summit.id,
        name: "Summit 2026",
        startDate: "2026-06-13",
        endDate: "2026-06-14",
        isActive: true,
      })
      .returning();
    event = ev!;
  });

  /** Seven dancers with a year, GPA and state each, and the coach viewing them. */
  async function seedRoster() {
    const profiles = [
      { firstName: "Abe", gradYear: 2027, gpa: 2.1, state: "TX" },
      { firstName: "Bea", gradYear: 2027, gpa: 2.5, state: "tx" },
      { firstName: "Cal", gradYear: 2028, gpa: 3.2, state: "CA" },
      { firstName: "Dee", gradYear: 2028, gpa: 3.5, state: "NY" },
      { firstName: "Eve", gradYear: 2029, gpa: 4.0, state: "FL" },
      { firstName: "Fay", gradYear: null, gpa: null, state: "WA" },
      { firstName: "Gus", gradYear: 2027, gpa: 3.9, state: "OR" },
    ];
    const dancers = await db
      .insert(eventRosters)
      .values(
        profiles.map(({ firstName }, index) => ({
          eventId: event.id,
          type: "dancer" as const,
          email: `${firstName.toLowerCase()}@x.co`,
          firstName,
          lastName: "Dancer",
          bibNumber: 101 + index,
        }))
      )
      .returning();
    await db.insert(eventDancerProfiles).values(
      profiles.map(({ firstName: _, ...profile }, index) => ({
        rosterId: dancers[index]!.id,
        ...profile,
      }))
    );
    const [coach] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        type: "coach",
        email: "coach@x.co",
        firstName: "Coach",
        lastName: "Person",
      })
      .returning();
    const view = {
      eventId: event.id,
      coachRosterId: coach!.id,
      showcaseId: null,
    };
    return { dancers, view };
  }

  test("counts the talent pool over every dancer, not the filtered list", async ({
    assert,
  }) => {
    const { view } = await seedRoster();
    const svc = new SummarizeDancersService();

    const { talentPool, counts } = await svc.execute(
      summit.id,
      event.id,
      view,
      { year: 2028 }
    );

    assert.deepEqual(talentPool.years, [
      { year: 2027, count: 3 },
      { year: 2028, count: 2 },
      { year: 2029, count: 1 },
    ]);
    // At least the low end, under the high end; a blank GPA is in no band.
    assert.deepEqual(talentPool.gpa, [
      { key: "under-2.5", count: 1 },
      { key: "2.5-3.0", count: 1 },
      { key: "3.0-3.5", count: 1 },
      { key: "3.5-4.0", count: 2 },
      { key: "4.0+", count: 1 },
    ]);
    // States fold case; the top five by count, then by code, and the rest counted.
    assert.deepEqual(talentPool.states, [
      { state: "TX", count: 2 },
      { state: "CA", count: 1 },
      { state: "FL", count: 1 },
      { state: "NY", count: 1 },
      { state: "OR", count: 1 },
    ]);
    assert.equal(talentPool.otherStates, 1);
    assert.equal(counts.all, 7);
    assert.equal(counts.matching, 2);
  });

  test("counts what the coach has reviewed and what is left that matches", async ({
    assert,
  }) => {
    const { dancers, view } = await seedRoster();
    const [abe, bea, cal] = dancers;
    const mark = (dancer: typeof abe) => ({
      eventId: event.id,
      coachRosterId: view.coachRosterId,
      dancerRosterId: dancer!.id,
    });
    await db.insert(eventFavorites).values(mark(abe));
    await db.insert(eventRatings).values({ ...mark(bea), rating: 3 });
    await db.insert(eventNotes).values({ ...mark(cal), content: "Strong" });
    const svc = new SummarizeDancersService();

    const { counts } = await svc.execute(summit.id, event.id, view, {
      year: 2028,
    });

    assert.deepEqual(counts, {
      all: 7,
      reviewed: 3,
      toReview: 4,
      // Cal and Dee are 2028; Cal has a note, so only Dee is left to review.
      matching: 2,
      matchingToReview: 1,
      favorites: 1,
      calledBack: 0,
    });
  });

  test("lists the coach's latest marks on the event, newest first", async ({
    assert,
  }) => {
    const { dancers, view } = await seedRoster();
    const [abe, bea, cal] = dancers;
    const mark = (dancer: typeof abe, minutesAgo: number) => ({
      eventId: event.id,
      coachRosterId: view.coachRosterId,
      dancerRosterId: dancer!.id,
      createdAt: new Date(Date.now() - minutesAgo * 60_000),
      updatedAt: new Date(Date.now() - minutesAgo * 60_000),
    });
    await db.insert(eventFavorites).values(mark(abe, 30));
    await db.insert(eventRatings).values({ ...mark(bea, 10), rating: 4 });
    await db.insert(eventNotes).values({ ...mark(cal, 20), content: "Turns" });
    // Another coach's mark stays out of the feed.
    const [other] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        type: "coach",
        email: "other@x.co",
        firstName: "Other",
        lastName: "Coach",
      })
      .returning();
    await db.insert(eventFavorites).values({
      ...mark(cal, 1),
      coachRosterId: other!.id,
    });
    const svc = new SummarizeDancersService();

    const { activity } = await svc.execute(summit.id, event.id, view, {});
    const noView = await svc.execute(summit.id, event.id, null, {});

    assert.deepEqual(
      activity.map(({ type, firstName, rating, bibNumber }) => ({
        type,
        firstName,
        rating,
        bibNumber,
      })),
      [
        { type: "rate", firstName: "Bea", rating: 4, bibNumber: 102 },
        { type: "note", firstName: "Cal", rating: null, bibNumber: 103 },
        { type: "favorite", firstName: "Abe", rating: null, bibNumber: 101 },
      ]
    );
    assert.deepEqual(noView.activity, []);
  });
});
