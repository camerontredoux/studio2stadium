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
import { DancerCallbackDetailService } from "./service.ts";

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

async function addCoach(eventId: string, name: string, organization: string) {
  const [roster] = await db
    .insert(eventRosters)
    .values({
      eventId,
      type: "coach",
      email: `${name}@test.co`,
      firstName: name,
      lastName: "Coach",
      organization,
    })
    .returning();
  return roster!;
}

async function addDancer(eventId: string, bib: number) {
  const [roster] = await db
    .insert(eventRosters)
    .values({
      eventId,
      type: "dancer",
      email: `dancer${bib}@test.co`,
      firstName: "Dee",
      lastName: "Dancer",
      bibNumber: bib,
    })
    .returning();
  return roster!;
}

async function callback(
  eventId: string,
  showcaseId: string,
  coachRosterId: string,
  dancerRosterId: string,
  published: boolean
) {
  await db
    .insert(eventCallbacks)
    .values({ eventId, showcaseId, coachRosterId, dancerRosterId });
  if (published) {
    await db
      .insert(publishedCallbacks)
      .values({ showcaseId, coachRosterId, dancerRosterId, rank: 1 });
  }
}

test.group("DancerCallbackDetailService", (group) => {
  group.each.setup(async () => {
    await db.delete(publishedCallbacks).execute();
    await db.delete(eventCallbacks).execute();
    await db.delete(eventRatings).execute();
    await db.delete(eventShowcases).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
  });

  test("collapses a school that called the dancer back in several showcases", async ({
    assert,
  }) => {
    const { org, event } = await setup();
    const sc2 = await addShowcase(event.id, 2, "published");
    const sc4 = await addShowcase(event.id, 4, "published");
    const sc5 = await addShowcase(event.id, 5, "published");
    const idaho = await addCoach(event.id, "Jordan", "University of Idaho");
    const dancer = await addDancer(event.id, 1);

    for (const sc of [sc2, sc4, sc5]) {
      await callback(event.id, sc.id, idaho.id, dancer.id, true);
    }

    const rows = await new DancerCallbackDetailService().execute(
      org.id,
      dancer.id
    );

    assert.lengthOf(rows, 1);
    assert.equal(rows[0]!.organization, "University of Idaho");
    assert.deepEqual(rows[0]!.showcaseNumbers, [5, 4, 2]);
    assert.equal(rows[0]!.latestShowcaseNumber, 5);
    assert.equal(rows[0]!.callbackCount, 3);
    assert.equal(rows[0]!.releasedCount, 3);
  });

  test("keeps separate schools as separate rows, newest interest first", async ({
    assert,
  }) => {
    const { org, event } = await setup();
    const sc2 = await addShowcase(event.id, 2, "published");
    const sc5 = await addShowcase(event.id, 5, "published");
    const idaho = await addCoach(event.id, "Jordan", "University of Idaho");
    const gcu = await addCoach(event.id, "Jacque", "Grand Canyon University");
    const dancer = await addDancer(event.id, 1);

    await callback(event.id, sc2.id, idaho.id, dancer.id, true);
    await callback(event.id, sc5.id, gcu.id, dancer.id, true);

    const rows = await new DancerCallbackDetailService().execute(
      org.id,
      dancer.id
    );

    assert.lengthOf(rows, 2);
    assert.equal(rows[0]!.organization, "Grand Canyon University");
    assert.equal(rows[1]!.organization, "University of Idaho");
  });

  test("keeps the pre-collapse fields readable by older frontend bundles", async ({
    assert,
  }) => {
    const { org, event } = await setup();
    const published = await addShowcase(event.id, 1, "published");
    const active = await addShowcase(event.id, 2, "active");
    const released = await addCoach(event.id, "Rel", "Released University");
    const mixed = await addCoach(event.id, "Mix", "Mixed University");
    const dancer = await addDancer(event.id, 1);

    await callback(event.id, published.id, released.id, dancer.id, true);
    await callback(event.id, published.id, mixed.id, dancer.id, true);
    await callback(event.id, active.id, mixed.id, dancer.id, false);

    const rows = await new DancerCallbackDetailService().execute(
      org.id,
      dancer.id
    );

    const rel = rows.find((r) => r.organization === "Released University")!;
    assert.equal(rel.showcaseNumber, 1);
    assert.isTrue(rel.isPublished);

    // A school with a pending callback must not read as fully released to an
    // older bundle, which only has this boolean to go on.
    const mix = rows.find((r) => r.organization === "Mixed University")!;
    assert.equal(mix.showcaseNumber, 2);
    assert.isFalse(mix.isPublished);
  });

  test("counts released and pending callbacks separately on a collapsed row", async ({
    assert,
  }) => {
    const { org, event } = await setup();
    const published = await addShowcase(event.id, 1, "published");
    const active = await addShowcase(event.id, 2, "active");
    const coach = await addCoach(event.id, "Mixed", "Mixed University");
    const dancer = await addDancer(event.id, 1);

    await callback(event.id, published.id, coach.id, dancer.id, true);
    await callback(event.id, active.id, coach.id, dancer.id, false);

    const rows = await new DancerCallbackDetailService().execute(
      org.id,
      dancer.id
    );

    assert.lengthOf(rows, 1);
    assert.equal(rows[0]!.callbackCount, 2);
    assert.equal(rows[0]!.releasedCount, 1);
    assert.deepEqual(rows[0]!.showcaseNumbers, [2, 1]);
  });
});
