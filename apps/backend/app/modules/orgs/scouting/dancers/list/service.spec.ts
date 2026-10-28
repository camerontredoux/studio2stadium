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
import { imageUrl } from "#utils/image-url";
import { eq } from "drizzle-orm";
import { ListDancersService } from "./service.ts";

test.group("ListDancersService", (group) => {
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

  test("returns all dancers when no filter", async ({ assert }) => {
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "alice@x.co",
        firstName: "Alice",
        lastName: "Smith",
        bibNumber: 101,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        bibNumber: 102,
      },
      {
        eventId: event.id,
        type: "coach",
        email: "coach@x.co",
        firstName: "Coach",
        lastName: "Person",
      },
    ]);

    const svc = new ListDancersService();
    const { data: rows } = await svc.execute(summit.id, event.id, null, {});
    assert.equal(rows.length, 2);
    assert.isTrue(rows.every((r) => r.bibNumber !== null));
  });

  test("filters by search on firstName", async ({ assert }) => {
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "alice@x.co",
        firstName: "Alice",
        lastName: "Smith",
        bibNumber: 101,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        bibNumber: 102,
      },
    ]);

    const svc = new ListDancersService();
    const { data: rows } = await svc.execute(summit.id, event.id, null, {
      search: "alice",
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.firstName, "Alice");
  });

  test("filters by search on lastName", async ({ assert }) => {
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "alice@x.co",
        firstName: "Alice",
        lastName: "Smith",
        bibNumber: 101,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        bibNumber: 102,
      },
    ]);

    const svc = new ListDancersService();
    const { data: rows } = await svc.execute(summit.id, event.id, null, {
      search: "jones",
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.lastName, "Jones");
  });

  test("filters by exact bib number", async ({ assert }) => {
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "alice@x.co",
        firstName: "Alice",
        lastName: "Smith",
        bibNumber: 101,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        bibNumber: 102,
      },
    ]);

    const svc = new ListDancersService();
    const { data: rows } = await svc.execute(summit.id, event.id, null, {
      bib: 101,
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.bibNumber, 101);
  });

  test("returns isRegistered on rows", async ({ assert }) => {
    const [aliceUser] = await db
      .insert(users)
      .values({
        username: "alice",
        email: "alice@x.co",
        displayEmail: "alice@x.co",
        firstName: "Alice",
        lastName: "Smith",
        password: "x",
        role: "user",
        type: "dancer",
        verified: true,
      })
      .returning();

    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "alice@x.co",
        firstName: "Alice",
        lastName: "Smith",
        bibNumber: 101,
        userId: aliceUser!.id,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@x.co",
        firstName: "Bob",
        lastName: "Jones",
        bibNumber: 102,
      },
    ]);

    const svc = new ListDancersService();
    const { data: rows } = await svc.execute(summit.id, event.id, null, {});
    const alice = rows.find((r) => r.firstName === "Alice");
    const bob = rows.find((r) => r.firstName === "Bob");
    assert.isTrue(alice!.isRegistered);
    assert.isFalse(bob!.isRegistered);
  });

  test("works when no eventDancerProfiles row exists (leftJoin nulls)", async ({
    assert,
  }) => {
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "ghost@x.co",
        firstName: "Ghost",
        lastName: "Dancer",
        bibNumber: 201,
      },
    ]);

    const svc = new ListDancersService();
    const { data: rows } = await svc.execute(summit.id, event.id, null, {});
    assert.equal(rows.length, 1);
    assert.isNull(rows[0]!.profilePhotoUrl);
    assert.isNull(rows[0]!.studio);
  });

  test("falls back to the linked account's avatar when there is no event photo", async ({
    assert,
  }) => {
    const [user] = await db
      .insert(users)
      .values({
        username: "alice",
        email: "alice@x.co",
        displayEmail: "alice@x.co",
        firstName: "Alice",
        lastName: "Smith",
        password: "x",
        role: "user",
        type: "dancer",
        verified: true,
        avatar: "avatar/alice/photo",
      })
      .returning();
    await db.insert(eventRosters).values({
      eventId: event.id,
      type: "dancer",
      email: "alice@x.co",
      firstName: "Alice",
      lastName: "Smith",
      bibNumber: 101,
      userId: user!.id,
    });

    const svc = new ListDancersService();
    const { data: rows } = await svc.execute(summit.id, event.id, null, {});
    assert.equal(
      rows[0]!.profilePhotoUrl,
      imageUrl("avatar/alice/photo", "avatar")
    );
  });

  test("returns eventDancerProfiles fields when profile exists", async ({
    assert,
  }) => {
    const [roster] = await db
      .insert(eventRosters)
      .values([
        {
          eventId: event.id,
          type: "dancer",
          email: "pro@x.co",
          firstName: "Pro",
          lastName: "Dancer",
          bibNumber: 301,
        },
      ])
      .returning();

    await db.insert(eventDancerProfiles).values({
      rosterId: roster!.id,
      profilePhotoUrl: "https://cdn.example.com/photo.jpg",
      studio: "Elite Dance",
      state: "CA",
      gradYear: 2025,
      gpa: 3.8,
    });

    const svc = new ListDancersService();
    const { data: rows } = await svc.execute(summit.id, event.id, null, {});
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.profilePhotoUrl, "https://cdn.example.com/photo.jpg");
    assert.equal(rows[0]!.studio, "Elite Dance");
    assert.equal(rows[0]!.state, "CA");
  });

  test("spans all of the org's events when allEvents is set", async ({
    assert,
  }) => {
    const [pastEvent] = await db
      .insert(orgEvents)
      .values({
        orgId: summit.id,
        name: "Summit 2025",
        startDate: "2025-06-13",
        endDate: "2025-06-14",
        isActive: false,
      })
      .returning();

    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "current@x.co",
        firstName: "Current",
        lastName: "Dancer",
        bibNumber: 101,
      },
      {
        eventId: pastEvent!.id,
        type: "dancer",
        email: "past@x.co",
        firstName: "Past",
        lastName: "Dancer",
        bibNumber: 201,
      },
    ]);

    const svc = new ListDancersService();

    const { data: all } = await svc.execute(summit.id, event.id, null, {});
    assert.equal(all.length, 2);
  });

  test("dedupes a registered dancer across events, preferring the active event", async ({
    assert,
  }) => {
    const [dana] = await db
      .insert(users)
      .values({
        username: "dana",
        email: "dana@x.co",
        displayEmail: "dana@x.co",
        firstName: "Dana",
        lastName: "Lee",
        password: "x",
        role: "user",
        type: "dancer",
        verified: true,
      })
      .returning();

    const [pastEvent] = await db
      .insert(orgEvents)
      .values({
        orgId: summit.id,
        name: "Summit 2025",
        startDate: "2025-06-13",
        endDate: "2025-06-14",
        isActive: false,
      })
      .returning();

    await db.insert(eventRosters).values({
      eventId: pastEvent!.id,
      type: "dancer",
      email: "dana@x.co",
      firstName: "Dana",
      lastName: "Lee",
      bibNumber: 55,
      userId: dana!.id,
    });
    const [activeRoster] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        type: "dancer",
        email: "dana@x.co",
        firstName: "Dana",
        lastName: "Lee",
        bibNumber: 66,
        userId: dana!.id,
      })
      .returning();

    const svc = new ListDancersService();
    const { data: all } = await svc.execute(summit.id, event.id, null, {});
    assert.equal(all.length, 1);
    assert.equal(all[0]!.rosterId, activeRoster!.id);
  });

  test("keeps distinct unclaimed dancers apart across events", async ({
    assert,
  }) => {
    const [pastEvent] = await db
      .insert(orgEvents)
      .values({
        orgId: summit.id,
        name: "Summit 2025",
        startDate: "2025-06-13",
        endDate: "2025-06-14",
        isActive: false,
      })
      .returning();

    await db.insert(eventRosters).values([
      {
        eventId: pastEvent!.id,
        type: "dancer",
        email: "one@x.co",
        firstName: "One",
        lastName: "Dancer",
        bibNumber: 12,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "two@x.co",
        firstName: "Two",
        lastName: "Dancer",
        bibNumber: 14,
      },
    ]);

    const svc = new ListDancersService();
    const { data: all } = await svc.execute(summit.id, event.id, null, {});
    assert.equal(all.length, 2);
  });

  test("hides the bib of a dancer who is not on the active event", async ({
    assert,
  }) => {
    const [pastEvent] = await db
      .insert(orgEvents)
      .values({
        orgId: summit.id,
        name: "Summit 2025",
        startDate: "2025-06-13",
        endDate: "2025-06-14",
        isActive: false,
      })
      .returning();

    await db.insert(eventRosters).values([
      {
        eventId: pastEvent!.id,
        type: "dancer",
        email: "gone@x.co",
        firstName: "Gone",
        lastName: "Dancer",
        bibNumber: 12,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "here@x.co",
        firstName: "Here",
        lastName: "Dancer",
        bibNumber: 300,
      },
    ]);

    const svc = new ListDancersService();
    const { data: all } = await svc.execute(summit.id, event.id, null, {});
    const gone = all.find((r) => r.lastName === "Dancer" && !r.bibNumber);
    const here = all.find((r) => r.firstName === "Here");
    assert.equal(here!.bibNumber, 300);
    assert.isNotNull(gone);
    assert.isNull(gone!.bibNumber);

    // Browsing that past event directly still shows the bib it issued.
    const { data: pastOnly } = await svc.execute(
      summit.id,
      event.id,
      null,
      {},
      false,
      pastEvent!.id
    );
    assert.equal(pastOnly[0]!.bibNumber, 12);
  });
  test("dedupes an unclaimed past-event row against the dancer's claimed row", async ({
    assert,
  }) => {
    const [abbey] = await db
      .insert(users)
      .values({
        username: "abbey",
        email: "abbey@x.co",
        displayEmail: "abbey@x.co",
        firstName: "Abbey",
        lastName: "Nugent",
        password: "x",
        role: "user",
        type: "dancer",
        verified: true,
      })
      .returning();

    const [pastEvent] = await db
      .insert(orgEvents)
      .values({
        orgId: summit.id,
        name: "Summit 2025",
        startDate: "2025-06-13",
        endDate: "2025-06-14",
        isActive: false,
      })
      .returning();

    // The past-event row was never claimed, so it holds no userId — only the
    // email ties it back to the dancer's row on the active event.
    await db.insert(eventRosters).values({
      eventId: pastEvent!.id,
      type: "dancer",
      email: "Abbey@X.co",
      firstName: "Abbey",
      lastName: "Nugent",
      bibNumber: 12,
    });
    const [activeRoster] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        type: "dancer",
        email: "abbey@x.co",
        firstName: "Abbey",
        lastName: "Nugent",
        bibNumber: 200,
        userId: abbey!.id,
      })
      .returning();

    const svc = new ListDancersService();
    const { data: all } = await svc.execute(summit.id, event.id, null, {});
    assert.equal(all.length, 1);
    assert.equal(all[0]!.rosterId, activeRoster!.id);
    assert.equal(all[0]!.bibNumber, 200);
  });

  /** Five dancers on the active event, bibs 101 to 105, plus one coach. */
  async function seedRoster() {
    const dancers = await db
      .insert(eventRosters)
      .values(
        ["Eve", "Dee", "Cal", "Bea", "Abe"].map((firstName, index) => ({
          eventId: event.id,
          type: "dancer" as const,
          email: `${firstName.toLowerCase()}@x.co`,
          firstName,
          lastName: "Dancer",
          bibNumber: 101 + index,
        }))
      )
      .returning();
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

  test("pages after the dedupe and reports the total", async ({ assert }) => {
    await seedRoster();
    const svc = new ListDancersService();

    const first = await svc.execute(summit.id, event.id, null, { limit: 2 });
    const last = await svc.execute(summit.id, event.id, null, {
      limit: 2,
      page: 2,
    });

    assert.deepEqual(
      first.data.map((r) => r.bibNumber),
      [101, 102]
    );
    assert.deepEqual(
      last.data.map((r) => r.bibNumber),
      [105]
    );
    assert.equal(first.total, 5);
    assert.equal(first.counts.all, 5);
  });

  test("sorts on the server, blanks last in both directions", async ({
    assert,
  }) => {
    await seedRoster();
    await db.insert(eventRosters).values({
      eventId: event.id,
      type: "dancer",
      email: "nobib@x.co",
      firstName: "Zed",
      lastName: "Dancer",
    });
    const svc = new ListDancersService();

    const byName = await svc.execute(summit.id, event.id, null, {
      sortBy: "name",
      sortDir: "desc",
    });
    const byBibDesc = await svc.execute(summit.id, event.id, null, {
      sortBy: "bib",
      sortDir: "desc",
    });

    assert.deepEqual(
      byName.data.map((r) => r.firstName),
      ["Zed", "Eve", "Dee", "Cal", "Bea", "Abe"]
    );
    assert.deepEqual(
      byBibDesc.data.map((r) => r.bibNumber),
      [105, 104, 103, 102, 101, null]
    );
  });

  test("searches bib, name and studio, treating wildcards as text", async ({
    assert,
  }) => {
    const { dancers } = await seedRoster();
    await db.insert(eventDancerProfiles).values({
      rosterId: dancers[0]!.id,
      studio: "100% Dance",
    });
    const svc = new ListDancersService();

    const byBib = await svc.execute(summit.id, event.id, null, {
      search: "103",
    });
    const byStudio = await svc.execute(summit.id, event.id, null, {
      search: "100%",
    });
    const wildcard = await svc.execute(summit.id, event.id, null, {
      search: "_",
    });

    assert.deepEqual(
      byBib.data.map((r) => r.firstName),
      ["Cal"]
    );
    assert.deepEqual(
      byStudio.data.map((r) => r.firstName),
      ["Eve"]
    );
    assert.lengthOf(wildcard.data, 0);
    assert.equal(byStudio.counts.all, 5);
  });

  test("filters to the coach's marks and ranks rated dancers", async ({
    assert,
  }) => {
    const { dancers, view } = await seedRoster();
    const [eve, dee, cal] = dancers;
    await db.insert(eventFavorites).values(
      [dee!, cal!].map((dancer) => ({
        eventId: event.id,
        coachRosterId: view.coachRosterId,
        dancerRosterId: dancer.id,
      }))
    );
    await db.insert(eventRatings).values(
      [
        [eve!, 4],
        [dee!, 3],
        [cal!, 4],
      ].map(([dancer, rating]) => ({
        eventId: event.id,
        coachRosterId: view.coachRosterId,
        dancerRosterId: (dancer as typeof eve)!.id,
        rating: rating as number,
      }))
    );
    const svc = new ListDancersService();

    const favorites = await svc.execute(summit.id, event.id, view, {
      filter: "favorites",
    });
    const ranked = await svc.execute(summit.id, event.id, view, {
      filter: "rated",
      sortBy: "rank",
    });

    assert.deepEqual(
      favorites.data.map((r) => r.firstName),
      ["Dee", "Cal"]
    );
    // Rating first, then favourites, then bib.
    assert.deepEqual(
      ranked.data.map((r) => r.firstName),
      ["Cal", "Eve", "Dee"]
    );
    assert.deepEqual(favorites.counts, {
      all: 5,
      favorites: 2,
      calledBack: 0,
      rated: 3,
    });
  });
  test("narrows to every filter set, leaving the tab counts whole", async ({
    assert,
  }) => {
    const { dancers, view } = await seedRoster();
    const [eve, dee, cal, bea] = dancers;
    const mark = (dancer: typeof eve) => ({
      eventId: event.id,
      coachRosterId: view.coachRosterId,
      dancerRosterId: dancer!.id,
    });
    await db.insert(eventFavorites).values([mark(dee), mark(cal)]);
    await db.insert(eventRatings).values([
      { ...mark(eve), rating: 4 },
      { ...mark(cal), rating: 5 },
    ]);
    await db.insert(eventNotes).values([
      { ...mark(cal), content: "Clean turns" },
      { ...mark(dee), content: "Ask about summer" },
    ]);
    await db.insert(eventSchoolSelections).values([
      { ...mark(cal), rank: 1 },
      { ...mark(eve), rank: 2 },
    ]);
    await db.insert(eventDancerProfiles).values([
      { rosterId: eve!.id, gpa: 4.0, state: "TX" },
      { rosterId: dee!.id, gpa: 3.5, state: "CA" },
      { rosterId: cal!.id, gpa: 3.2, state: "TX" },
      { rosterId: bea!.id, state: "TX" },
    ]);
    const svc = new ListDancersService();
    const names = async (q: Parameters<ListDancersService["execute"]>[3]) => {
      const { data } = await svc.execute(summit.id, event.id, view, q);
      return data.map((r) => r.firstName);
    };

    assert.deepEqual(
      await names({
        interested: true,
        favorited: true,
        rated: true,
        hasNote: true,
      }),
      ["Cal"]
    );
    assert.deepEqual(await names({ interested: true }), ["Eve", "Cal"]);
    assert.deepEqual(await names({ hasNote: true }), ["Dee", "Cal"]);
    // At least the low end, under the high end; a blank GPA matches no range.
    assert.deepEqual(await names({ gpaMin: 3.5 }), ["Eve", "Dee"]);
    assert.deepEqual(await names({ gpaMin: 3, gpaBelow: 3.5 }), ["Cal"]);
    assert.deepEqual(await names({ gpaMin: 3.5, gpaBelow: 4 }), ["Dee"]);
    assert.deepEqual(await names({ gpaMin: 4 }), ["Eve"]);
    assert.deepEqual(await names({ gpaBelow: 2.5 }), []);
    assert.deepEqual(await names({ state: "TX" }), ["Eve", "Cal", "Bea"]);

    const filtered = await svc.execute(summit.id, event.id, view, {
      state: "TX",
      favorited: true,
    });
    assert.equal(filtered.total, 1);
    assert.equal(filtered.counts.all, 5);
  });

  test("filters by graduation year", async ({ assert }) => {
    const { dancers, view } = await seedRoster();
    const [eve, dee, cal] = dancers;
    await db.insert(eventDancerProfiles).values([
      { rosterId: eve!.id, gradYear: 2027 },
      { rosterId: dee!.id, gradYear: 2028 },
      { rosterId: cal!.id, gradYear: 2027 },
    ]);
    const svc = new ListDancersService();

    const result = await svc.execute(summit.id, event.id, view, {
      year: 2027,
    });

    assert.deepEqual(
      result.data.map((r) => r.firstName),
      ["Eve", "Cal"]
    );
    assert.equal(result.total, 2);
    assert.equal(result.counts.all, 5);
  });
});
