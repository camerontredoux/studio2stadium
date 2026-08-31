import { test } from "@japa/runner";
import { db } from "#database/connection";
import { getUserSession } from "#auth/queries";
import {
  eventCallbacks,
  eventFavorites,
  eventNotes,
  eventRatings,
  eventShowcases,
  publishedCallbacks,
} from "#database/schema/event-features";
import {
  eventDancerProfiles,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import redis from "@adonisjs/redis/services/main";
import { MessageBuilder } from "@adonisjs/core/helpers";
import { randomUUID } from "node:crypto";

function dateFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function createUser(
  username: string,
  type: "school" | "dancer" = "school"
) {
  const email = `${username}@example.com`;
  const [user] = await db
    .insert(users)
    .values({
      username,
      email,
      displayEmail: email,
      firstName: username,
      lastName: "Test",
      password: "hashed",
      role: "user",
      type,
      verified: true,
    })
    .returning();
  return user!;
}

async function loginUser(userId: string) {
  const session = await getUserSession(userId);
  if (!session) throw new Error("Test user session was not created");
  const token = randomUUID();
  const version = Date.now();
  const connection = redis.connection("session");
  await connection.setex(`version:${userId}`, 3600, version);
  await connection.setex(
    token,
    3600,
    new MessageBuilder().build({ version, user: session }, undefined, token)
  );
  return token;
}

test.group("coach cross-event scouting access", (group) => {
  group.each.setup(async () => {
    await db.delete(publishedCallbacks).execute();
    await db.delete(eventCallbacks).execute();
    await db.delete(eventFavorites).execute();
    await db.delete(eventNotes).execute();
    await db.delete(eventRatings).execute();
    await db.delete(eventShowcases).execute();
    await db.delete(eventDancerProfiles).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(dancerProfiles).execute();
    await db.delete(schoolProfiles).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
  });

  test("a future-event coach can browse every event but cannot write active-event scouting data", async ({
    client,
    assert,
  }) => {
    const [org] = await db
      .insert(organizations)
      .values({
        name: "Cross Event Org",
        slug: "cross-event-org",
        features: { callbacks: true },
      })
      .returning();
    const [activeEvent, futureEvent] = await db
      .insert(orgEvents)
      .values([
        {
          orgId: org!.id,
          name: "Active Event",
          startDate: dateFromToday(-1),
          endDate: dateFromToday(1),
          isActive: true,
        },
        {
          orgId: org!.id,
          name: "Future Event",
          startDate: dateFromToday(30),
          endDate: dateFromToday(32),
        },
      ])
      .returning();
    const coach = await createUser("future_coach");
    await db.insert(orgMemberships).values({
      orgId: org!.id,
      userId: coach.id,
      role: "member",
      type: "coach",
    });
    await db.insert(eventRosters).values({
      eventId: futureEvent!.id,
      userId: coach.id,
      type: "coach",
      email: coach.email,
      firstName: "Future",
      lastName: "Coach",
    });
    const [activeDancer, futureDancer] = await db
      .insert(eventRosters)
      .values([
        {
          eventId: activeEvent!.id,
          type: "dancer",
          email: "active-dancer@example.com",
          firstName: "Active",
          lastName: "Dancer",
          bibNumber: 10,
        },
        {
          eventId: futureEvent!.id,
          type: "dancer",
          email: "future-dancer@example.com",
          firstName: "Future",
          lastName: "Dancer",
          bibNumber: 20,
        },
      ])
      .returning();
    const token = await loginUser(coach.id);

    const list = await client
      .get(`/orgs/${org!.slug}/dancers`)
      .header("Authorization", `Bearer ${token}`);
    list.assertStatus(200);
    assert.deepEqual(
      list
        .body()
        .map((row: { firstName: string }) => row.firstName)
        .sort(),
      ["Active", "Future"]
    );
    assert.isTrue(
      list.body().every((row: { isFavorited: boolean }) => !row.isFavorited)
    );
    assert.isTrue(
      list.body().every((row: { rating: number | null }) => row.rating === null)
    );

    const detail = await client
      .get(`/orgs/${org!.slug}/dancers/${activeDancer!.id}`)
      .header("Authorization", `Bearer ${token}`);
    detail.assertStatus(200);
    assert.equal(detail.body().rosterId, activeDancer!.id);

    const filtered = await client
      .get(`/orgs/${org!.slug}/dancers`)
      .qs({ eventId: futureEvent!.id })
      .header("Authorization", `Bearer ${token}`);
    filtered.assertStatus(200);
    assert.deepEqual(
      filtered.body().map((row: { rosterId: string }) => row.rosterId),
      [futureDancer!.id]
    );
    const [otherOrg] = await db
      .insert(organizations)
      .values({ name: "Other Org", slug: "other-org" })
      .returning();
    const [otherOrgEvent] = await db
      .insert(orgEvents)
      .values({
        orgId: otherOrg!.id,
        name: "Other Org Event",
        startDate: dateFromToday(10),
        endDate: dateFromToday(11),
      })
      .returning();
    const invalidFilter = await client
      .get(`/orgs/${org!.slug}/dancers`)
      .qs({ eventId: otherOrgEvent!.id })
      .header("Authorization", `Bearer ${token}`);
    invalidFilter.assertStatus(422);

    const favorite = await client
      .post(`/orgs/${org!.slug}/favorites`)
      .json({ dancerRosterId: activeDancer!.id })
      .header("Authorization", `Bearer ${token}`);
    favorite.assertStatus(403);
    const rating = await client
      .put(`/orgs/${org!.slug}/dancers/${activeDancer!.id}/rating`)
      .json({ rating: 5 })
      .header("Authorization", `Bearer ${token}`);
    rating.assertStatus(403);
    const note = await client
      .put(`/orgs/${org!.slug}/dancers/${activeDancer!.id}/notes`)
      .json({ content: "Watch again" })
      .header("Authorization", `Bearer ${token}`);
    note.assertStatus(403);
    const callback = await client
      .post(`/orgs/${org!.slug}/callbacks`)
      .json({ dancerRosterId: activeDancer!.id })
      .header("Authorization", `Bearer ${token}`);
    callback.assertStatus(403);
  });

  test("an active-event coach retains full scouting writes", async ({
    client,
    assert,
  }) => {
    const [org] = await db
      .insert(organizations)
      .values({
        name: "Active Coach Org",
        slug: "active-coach-org",
        features: { callbacks: true },
      })
      .returning();
    const [event] = await db
      .insert(orgEvents)
      .values({
        orgId: org!.id,
        name: "Active Event",
        startDate: dateFromToday(-1),
        endDate: dateFromToday(1),
        isActive: true,
      })
      .returning();
    const coach = await createUser("active_coach");
    await db.insert(orgMemberships).values({
      orgId: org!.id,
      userId: coach.id,
      role: "member",
      type: "coach",
    });
    await db.insert(eventRosters).values({
      eventId: event!.id,
      userId: coach.id,
      type: "coach",
      email: coach.email,
      firstName: "Active",
      lastName: "Coach",
    });
    const [dancer] = await db
      .insert(eventRosters)
      .values({
        eventId: event!.id,
        type: "dancer",
        email: "active-write-dancer@example.com",
        firstName: "Write",
        lastName: "Dancer",
        bibNumber: 30,
      })
      .returning();
    const [otherEvent] = await db
      .insert(orgEvents)
      .values({
        orgId: org!.id,
        name: "Other Event",
        startDate: dateFromToday(30),
        endDate: dateFromToday(31),
      })
      .returning();
    const [otherEventDancer] = await db
      .insert(eventRosters)
      .values({
        eventId: otherEvent!.id,
        type: "dancer",
        email: "other-event-dancer@example.com",
        firstName: "Other",
        lastName: "Dancer",
        bibNumber: 31,
      })
      .returning();
    const token = await loginUser(coach.id);

    const list = await client
      .get(`/orgs/${org!.slug}/dancers`)
      .header("Authorization", `Bearer ${token}`);
    list.assertStatus(200);
    const favorite = await client
      .post(`/orgs/${org!.slug}/favorites`)
      .json({ dancerRosterId: dancer!.id })
      .header("Authorization", `Bearer ${token}`);
    favorite.assertStatus(201);
    const rating = await client
      .put(`/orgs/${org!.slug}/dancers/${dancer!.id}/rating`)
      .json({ rating: 5 })
      .header("Authorization", `Bearer ${token}`);
    rating.assertStatus(200);
    const note = await client
      .put(`/orgs/${org!.slug}/dancers/${dancer!.id}/notes`)
      .json({ content: "Strong technique" })
      .header("Authorization", `Bearer ${token}`);
    note.assertStatus(200);
    const callback = await client
      .post(`/orgs/${org!.slug}/callbacks`)
      .json({ dancerRosterId: dancer!.id })
      .header("Authorization", `Bearer ${token}`);
    callback.assertStatus(201);

    // The row and the sheet opened from it read callbacks the same way.
    const afterCallback = await client
      .get(`/orgs/${org!.slug}/dancers`)
      .qs({ eventId: event!.id })
      .header("Authorization", `Bearer ${token}`);
    afterCallback.assertStatus(200);
    const calledBackRow = afterCallback
      .body()
      .find((row: { rosterId: string }) => row.rosterId === dancer!.id);
    assert.isTrue(calledBackRow.isCalledBack);
    const calledBackSheet = await client
      .get(`/orgs/${org!.slug}/dancers/${dancer!.id}`)
      .qs({ eventId: event!.id })
      .header("Authorization", `Bearer ${token}`);
    calledBackSheet.assertStatus(200);
    assert.isTrue(calledBackSheet.body().isCalledBack);
    const crossEventRating = await client
      .put(`/orgs/${org!.slug}/dancers/${otherEventDancer!.id}/rating`)
      .json({ rating: 5 })
      .header("Authorization", `Bearer ${token}`);
    crossEventRating.assertStatus(403);
  });

  test("a coach reads back a past event's favorites, notes and ratings by filtering to it", async ({
    client,
    assert,
  }) => {
    const [org] = await db
      .insert(organizations)
      .values({ name: "History Org", slug: "history-org" })
      .returning();
    const [pastEvent, activeEvent] = await db
      .insert(orgEvents)
      .values([
        {
          orgId: org!.id,
          name: "Tempe",
          startDate: dateFromToday(-60),
          endDate: dateFromToday(-58),
        },
        {
          orgId: org!.id,
          name: "Austin",
          startDate: dateFromToday(-1),
          endDate: dateFromToday(1),
          isActive: true,
        },
      ])
      .returning();
    const coach = await createUser("history_coach");
    await db.insert(orgMemberships).values({
      orgId: org!.id,
      userId: coach.id,
      role: "member",
      type: "coach",
    });
    // A coach holds a separate roster row per event — the reason the past
    // event's marks were unreachable through the active-event roster.
    const [pastCoachRoster] = await db
      .insert(eventRosters)
      .values([
        {
          eventId: pastEvent!.id,
          userId: coach.id,
          type: "coach",
          email: coach.email,
          firstName: "History",
          lastName: "Coach",
        },
        {
          eventId: activeEvent!.id,
          userId: coach.id,
          type: "coach",
          email: coach.email,
          firstName: "History",
          lastName: "Coach",
        },
      ])
      .returning();
    const [pastDancer] = await db
      .insert(eventRosters)
      .values({
        eventId: pastEvent!.id,
        type: "dancer",
        email: "tempe-dancer@example.com",
        firstName: "Tempe",
        lastName: "Dancer",
        bibNumber: 50,
      })
      .returning();

    await db.insert(eventFavorites).values({
      eventId: pastEvent!.id,
      coachRosterId: pastCoachRoster!.id,
      dancerRosterId: pastDancer!.id,
    });
    await db.insert(eventNotes).values({
      eventId: pastEvent!.id,
      coachRosterId: pastCoachRoster!.id,
      dancerRosterId: pastDancer!.id,
      content: "Great turns at Tempe",
    });
    await db.insert(eventRatings).values({
      eventId: pastEvent!.id,
      coachRosterId: pastCoachRoster!.id,
      dancerRosterId: pastDancer!.id,
      rating: 5,
    });
    // Callbacks are per-event and deliberately not retained, unlike the marks
    // above — the past event's showcase is published, not active.
    const [pastShowcase] = await db
      .insert(eventShowcases)
      .values({ eventId: pastEvent!.id, number: 1, status: "published" })
      .returning();
    await db.insert(eventCallbacks).values({
      eventId: pastEvent!.id,
      showcaseId: pastShowcase!.id,
      coachRosterId: pastCoachRoster!.id,
      dancerRosterId: pastDancer!.id,
    });

    const token = await loginUser(coach.id);

    const list = await client
      .get(`/orgs/${org!.slug}/dancers`)
      .qs({ eventId: pastEvent!.id })
      .header("Authorization", `Bearer ${token}`);
    list.assertStatus(200);
    const listed = list.body()[0];
    assert.equal(listed.rosterId, pastDancer!.id);
    assert.isTrue(listed.isFavorited);
    assert.isTrue(listed.hasNote);
    assert.equal(listed.rating, 5);
    assert.isFalse(listed.isCalledBack);

    const favorites = await client
      .get(`/orgs/${org!.slug}/favorites`)
      .qs({ eventId: pastEvent!.id })
      .header("Authorization", `Bearer ${token}`);
    favorites.assertStatus(200);
    assert.deepEqual(
      favorites.body().map((row: { rosterId: string }) => row.rosterId),
      [pastDancer!.id]
    );

    const detail = await client
      .get(`/orgs/${org!.slug}/dancers/${pastDancer!.id}`)
      .qs({ eventId: pastEvent!.id })
      .header("Authorization", `Bearer ${token}`);
    detail.assertStatus(200);
    assert.equal(detail.body().note, "Great turns at Tempe");
    assert.equal(detail.body().rating, 5);
    assert.isTrue(detail.body().isFavorited);
    assert.isTrue(detail.body().isViewerRostered);
    assert.isFalse(detail.body().isCalledBack);

    // "All events" keeps the active-event scoping, so the Tempe marks stay out.
    const allEvents = await client
      .get(`/orgs/${org!.slug}/dancers`)
      .header("Authorization", `Bearer ${token}`);
    allEvents.assertStatus(200);
    const collapsed = allEvents
      .body()
      .find((row: { rosterId: string }) => row.rosterId === pastDancer!.id);
    assert.isFalse(collapsed.isFavorited);
    assert.isFalse(collapsed.hasNote);

    const activeFavorites = await client
      .get(`/orgs/${org!.slug}/favorites`)
      .header("Authorization", `Bearer ${token}`);
    activeFavorites.assertStatus(200);
    assert.lengthOf(activeFavorites.body(), 0);
  });

  test("starting the next showcase clears the callback in the list and the sheet alike", async ({
    client,
    assert,
  }) => {
    const [org] = await db
      .insert(organizations)
      .values({
        name: "Showcase Org",
        slug: "showcase-org",
        features: { callbacks: true },
      })
      .returning();
    const [event] = await db
      .insert(orgEvents)
      .values({
        orgId: org!.id,
        name: "Austin",
        startDate: dateFromToday(-1),
        endDate: dateFromToday(1),
        isActive: true,
      })
      .returning();
    const coach = await createUser("showcase_coach");
    await db.insert(orgMemberships).values({
      orgId: org!.id,
      userId: coach.id,
      role: "member",
      type: "coach",
    });
    const [coachRoster] = await db
      .insert(eventRosters)
      .values({
        eventId: event!.id,
        userId: coach.id,
        type: "coach",
        email: coach.email,
        firstName: "Showcase",
        lastName: "Coach",
      })
      .returning();
    const [dancer] = await db
      .insert(eventRosters)
      .values({
        eventId: event!.id,
        type: "dancer",
        email: "showcase-dancer@example.com",
        firstName: "Showcase",
        lastName: "Dancer",
        bibNumber: 80,
      })
      .returning();
    // The callback was made during showcase 1, which has since been published
    // and replaced by showcase 2 as the one running.
    const [firstShowcase] = await db
      .insert(eventShowcases)
      .values({ eventId: event!.id, number: 1, status: "published" })
      .returning();
    await db
      .insert(eventShowcases)
      .values({ eventId: event!.id, number: 2, status: "active" });
    await db.insert(eventCallbacks).values({
      eventId: event!.id,
      showcaseId: firstShowcase!.id,
      coachRosterId: coachRoster!.id,
      dancerRosterId: dancer!.id,
    });

    const token = await loginUser(coach.id);

    const list = await client
      .get(`/orgs/${org!.slug}/dancers`)
      .qs({ eventId: event!.id })
      .header("Authorization", `Bearer ${token}`);
    list.assertStatus(200);
    assert.isFalse(list.body()[0].isCalledBack);

    const detail = await client
      .get(`/orgs/${org!.slug}/dancers/${dancer!.id}`)
      .qs({ eventId: event!.id })
      .header("Authorization", `Bearer ${token}`);
    detail.assertStatus(200);
    assert.isFalse(detail.body().isCalledBack);
  });

  test("a coach absent from the active event still reads her past favorites", async ({
    client,
    assert,
  }) => {
    const [org] = await db
      .insert(organizations)
      .values({ name: "Absent Now Org", slug: "absent-now-org" })
      .returning();
    const [pastEvent] = await db
      .insert(orgEvents)
      .values([
        {
          orgId: org!.id,
          name: "Tempe",
          startDate: dateFromToday(-60),
          endDate: dateFromToday(-58),
        },
        {
          orgId: org!.id,
          name: "Austin",
          startDate: dateFromToday(-1),
          endDate: dateFromToday(1),
          isActive: true,
        },
      ])
      .returning();
    const coach = await createUser("lapsed_coach");
    await db.insert(orgMemberships).values({
      orgId: org!.id,
      userId: coach.id,
      role: "member",
      type: "coach",
    });
    // Rostered at Tempe only — she is not attending the event running now.
    const [pastCoachRoster] = await db
      .insert(eventRosters)
      .values({
        eventId: pastEvent!.id,
        userId: coach.id,
        type: "coach",
        email: coach.email,
        firstName: "Lapsed",
        lastName: "Coach",
      })
      .returning();
    const [pastDancer] = await db
      .insert(eventRosters)
      .values({
        eventId: pastEvent!.id,
        type: "dancer",
        email: "lapsed-dancer@example.com",
        firstName: "Lapsed",
        lastName: "Dancer",
        bibNumber: 70,
      })
      .returning();
    await db.insert(eventFavorites).values({
      eventId: pastEvent!.id,
      coachRosterId: pastCoachRoster!.id,
      dancerRosterId: pastDancer!.id,
    });

    const token = await loginUser(coach.id);

    const favorites = await client
      .get(`/orgs/${org!.slug}/favorites`)
      .qs({ eventId: pastEvent!.id })
      .header("Authorization", `Bearer ${token}`);
    favorites.assertStatus(200);
    assert.deepEqual(
      favorites.body().map((row: { rosterId: string }) => row.rosterId),
      [pastDancer!.id]
    );
  });

  test("a coach who never attended an event sees an empty, flagged board for it", async ({
    client,
    assert,
  }) => {
    const [org] = await db
      .insert(organizations)
      .values({ name: "Absent Org", slug: "absent-org" })
      .returning();
    const [missedEvent, activeEvent] = await db
      .insert(orgEvents)
      .values([
        {
          orgId: org!.id,
          name: "Lakeland",
          startDate: dateFromToday(-60),
          endDate: dateFromToday(-58),
        },
        {
          orgId: org!.id,
          name: "Austin",
          startDate: dateFromToday(-1),
          endDate: dateFromToday(1),
          isActive: true,
        },
      ])
      .returning();
    const coach = await createUser("absent_coach");
    await db.insert(orgMemberships).values({
      orgId: org!.id,
      userId: coach.id,
      role: "member",
      type: "coach",
    });
    await db.insert(eventRosters).values({
      eventId: activeEvent!.id,
      userId: coach.id,
      type: "coach",
      email: coach.email,
      firstName: "Absent",
      lastName: "Coach",
    });
    const [missedDancer] = await db
      .insert(eventRosters)
      .values({
        eventId: missedEvent!.id,
        type: "dancer",
        email: "lakeland-dancer@example.com",
        firstName: "Lakeland",
        lastName: "Dancer",
        bibNumber: 60,
      })
      .returning();

    const token = await loginUser(coach.id);

    const favorites = await client
      .get(`/orgs/${org!.slug}/favorites`)
      .qs({ eventId: missedEvent!.id })
      .header("Authorization", `Bearer ${token}`);
    favorites.assertStatus(200);
    assert.lengthOf(favorites.body(), 0);

    const detail = await client
      .get(`/orgs/${org!.slug}/dancers/${missedDancer!.id}`)
      .qs({ eventId: missedEvent!.id })
      .header("Authorization", `Bearer ${token}`);
    detail.assertStatus(200);
    assert.isFalse(detail.body().isViewerRostered);
    assert.isNull(detail.body().note);
  });

  test("dancer denial and org-admin coach access are unchanged", async ({
    client,
  }) => {
    const [org] = await db
      .insert(organizations)
      .values({ name: "Gating Org", slug: "gating-org" })
      .returning();
    const [event] = await db
      .insert(orgEvents)
      .values({
        orgId: org!.id,
        name: "Active Event",
        startDate: dateFromToday(-1),
        endDate: dateFromToday(1),
        isActive: true,
      })
      .returning();
    const dancer = await createUser("dancer_member", "dancer");
    const admin = await createUser("org_admin");
    await db.insert(orgMemberships).values([
      {
        orgId: org!.id,
        userId: dancer.id,
        role: "member",
        type: "dancer",
      },
      {
        orgId: org!.id,
        userId: admin.id,
        role: "admin",
        type: "coach",
      },
    ]);
    await db.insert(eventRosters).values({
      eventId: event!.id,
      userId: dancer.id,
      type: "dancer",
      email: dancer.email,
      firstName: "Dancer",
      lastName: "Member",
      bibNumber: 40,
    });

    const dancerToken = await loginUser(dancer.id);
    const denied = await client
      .get(`/orgs/${org!.slug}/dancers`)
      .header("Authorization", `Bearer ${dancerToken}`);
    denied.assertStatus(403);
    const adminToken = await loginUser(admin.id);
    const allowed = await client
      .get(`/orgs/${org!.slug}/dancers`)
      .header("Authorization", `Bearer ${adminToken}`);
    allowed.assertStatus(200);
  });
});
