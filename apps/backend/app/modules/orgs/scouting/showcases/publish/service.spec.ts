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
import { eq } from "drizzle-orm";
import { PublishShowcaseService } from "./service.ts";

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

  const [showcase] = await db
    .insert(eventShowcases)
    .values({ eventId: event!.id, number: 1, status: "active" })
    .returning();

  return { org: org!, event: event!, showcase: showcase! };
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

test.group("PublishShowcaseService", (group) => {
  group.each.setup(async () => {
    await db.delete(publishedCallbacks).execute();
    await db.delete(eventCallbacks).execute();
    await db.delete(eventRatings).execute();
    await db.delete(eventShowcases).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
  });

  test("publishes top 5 per coach ranked by rating DESC then recency DESC", async ({
    assert,
  }) => {
    const { event, showcase } = await setup();
    const coach = await addCoach(event.id, "Alice");

    const dancers = [];
    for (let i = 1; i <= 7; i++) {
      dancers.push(await addDancer(event.id, i, `D${i}`));
    }

    for (const d of dancers) {
      await db.insert(eventCallbacks).values({
        eventId: event.id,
        showcaseId: showcase.id,
        coachRosterId: coach.id,
        dancerRosterId: d.id,
      });
    }

    await db.insert(eventRatings).values([
      {
        eventId: event.id,
        coachRosterId: coach.id,
        dancerRosterId: dancers[0]!.id,
        rating: 9,
      },
      {
        eventId: event.id,
        coachRosterId: coach.id,
        dancerRosterId: dancers[1]!.id,
        rating: 7,
      },
      {
        eventId: event.id,
        coachRosterId: coach.id,
        dancerRosterId: dancers[2]!.id,
        rating: 10,
      },
    ]);

    const svc = new PublishShowcaseService();
    await svc.execute(event.id, showcase.id);

    const published = await db
      .select()
      .from(publishedCallbacks)
      .where(eq(publishedCallbacks.showcaseId, showcase.id))
      .orderBy(publishedCallbacks.rank);

    assert.lengthOf(published, 5);

    assert.equal(published[0]!.dancerRosterId, dancers[2]!.id);
    assert.equal(published[0]!.rank, 1);

    assert.equal(published[1]!.dancerRosterId, dancers[0]!.id);
    assert.equal(published[1]!.rank, 2);

    assert.equal(published[2]!.dancerRosterId, dancers[1]!.id);
    assert.equal(published[2]!.rank, 3);

    const updatedShowcase = await db
      .select()
      .from(eventShowcases)
      .where(eq(eventShowcases.id, showcase.id));
    assert.equal(updatedShowcase[0]!.status, "published");
    assert.isNotNull(updatedShowcase[0]!.publishedAt);
  });

  test("coach with fewer than 5 callbacks gets all published", async ({
    assert,
  }) => {
    const { event, showcase } = await setup();
    const coach = await addCoach(event.id, "Bob");
    const d1 = await addDancer(event.id, 10, "Solo");
    const d2 = await addDancer(event.id, 11, "Duo");

    await db.insert(eventCallbacks).values([
      {
        eventId: event.id,
        showcaseId: showcase.id,
        coachRosterId: coach.id,
        dancerRosterId: d1.id,
      },
      {
        eventId: event.id,
        showcaseId: showcase.id,
        coachRosterId: coach.id,
        dancerRosterId: d2.id,
      },
    ]);

    const svc = new PublishShowcaseService();
    await svc.execute(event.id, showcase.id);

    const published = await db
      .select()
      .from(publishedCallbacks)
      .where(eq(publishedCallbacks.showcaseId, showcase.id));

    assert.lengthOf(published, 2);
  });

  test("rejects publish if showcase is not active", async ({ assert }) => {
    const { event, showcase } = await setup();
    await db
      .update(eventShowcases)
      .set({ status: "published", publishedAt: new Date() })
      .where(eq(eventShowcases.id, showcase.id));

    const svc = new PublishShowcaseService();
    await assert.rejects(() => svc.execute(event.id, showcase.id));
  });
});
