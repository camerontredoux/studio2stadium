import { test } from "@japa/runner";
import type { ApiClient, ApiRequest } from "@japa/api-client";
import { db } from "#database/connection";
import { getUserSession } from "#auth/queries";
import { eventSchoolSelections } from "#database/schema/event-features";
import {
  eventRosters,
  eventVideoCategories,
  eventVideos,
  orgEvents,
} from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import {
  EVENT_TIER_CAPABILITIES,
  eventTierIncludes,
  type EventTier,
  type EventTierCapability,
} from "#shared/org/event-tiers";
import type { CapabilityOverrides } from "#shared/org/entitlement";
import redis from "@adonisjs/redis/services/main";
import { MessageBuilder } from "@adonisjs/core/helpers";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

/**
 * Check-in, school selections and the video library are bought per Org Event
 * (ADR 0002), so the backend has to refuse them at an event that does not
 * include them — not just hide them in the menu. These tests drive every route
 * behind each capability and pin which event the answer comes from.
 */

function dateFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function createUser(username: string, type: "school" | "dancer") {
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

type OrgEvent = typeof orgEvents.$inferSelect;

/** What one Org Event holds, so every gated route has something to act on. */
interface EventData {
  event: OrgEvent;
  dancerRosterId: string;
  /** A school the Dancer has not selected yet. */
  freeCoachRosterId: string;
  /** A selection the Dancer already made. */
  selectionId: string;
  /** A category holding `videoId`. */
  categoryId: string;
  /** A category with no videos, so it can be deleted. */
  emptyCategoryId: string;
  videoId: string;
}

interface Fixture {
  slug: string;
  orgId: string;
  adminToken: string;
  dancerToken: string;
  events: EventData[];
}

let usernameCounter = 0;
function nextUsername(prefix: string) {
  usernameCounter += 1;
  return `${prefix}_${usernameCounter}`;
}

async function coachRoster(eventId: string, orgId: string) {
  const coach = await createUser(nextUsername("gate_coach"), "school");
  await db
    .insert(orgMemberships)
    .values({ orgId, userId: coach.id, role: "member", type: "coach" })
    .onConflictDoNothing();
  const [roster] = await db
    .insert(eventRosters)
    .values({
      eventId,
      userId: coach.id,
      type: "coach",
      email: coach.email,
      firstName: "Gate",
      lastName: "Coach",
      organization: coach.username,
    })
    .returning();
  return roster!;
}

/**
 * An Org whose `features` JSONB grants nothing, with one Org Event per Event
 * Tier asked for — the first one active. An Organizer administers it, and one
 * Dancer is on every event's roster.
 */
async function orgWithEvents(
  slug: string,
  eventTiers: EventTier[]
): Promise<Fixture> {
  const [org] = await db
    .insert(organizations)
    .values({ name: slug, slug, features: {} })
    .returning();

  const events = await db
    .insert(orgEvents)
    .values(
      eventTiers.map((eventTier, index) => ({
        orgId: org!.id,
        name: `${slug} ${index} ${eventTier}`,
        // Already started, so check-in is open at every event.
        startDate: dateFromToday(-1),
        endDate: dateFromToday(2),
        isActive: index === 0,
        eventTier,
      }))
    )
    .returning();

  const organizer = await createUser(nextUsername("gate_organizer"), "school");
  await db.insert(orgMemberships).values({
    orgId: org!.id,
    userId: organizer.id,
    role: "member",
    type: "organizer",
  });

  const dancer = await createUser(nextUsername("gate_dancer"), "dancer");
  await db.insert(orgMemberships).values({
    orgId: org!.id,
    userId: dancer.id,
    role: "member",
    type: "dancer",
  });

  const data: EventData[] = [];
  for (const event of events) {
    const [dancerRoster] = await db
      .insert(eventRosters)
      .values({
        eventId: event.id,
        userId: dancer.id,
        type: "dancer",
        email: dancer.email,
        firstName: "Gate",
        lastName: "Dancer",
      })
      .returning();
    const freeCoach = await coachRoster(event.id, org!.id);
    const selectedCoach = await coachRoster(event.id, org!.id);
    const [selection] = await db
      .insert(eventSchoolSelections)
      .values({
        eventId: event.id,
        dancerRosterId: dancerRoster!.id,
        coachRosterId: selectedCoach.id,
      })
      .returning();
    const [category, emptyCategory] = await db
      .insert(eventVideoCategories)
      .values([
        { eventId: event.id, name: "Combos" },
        { eventId: event.id, name: "Empty" },
      ])
      .returning();
    const [video] = await db
      .insert(eventVideos)
      .values({
        eventId: event.id,
        categoryId: category!.id,
        title: "Jazz combo",
        youtubeId: "dQw4w9WgXcQ",
      })
      .returning();

    data.push({
      event,
      dancerRosterId: dancerRoster!.id,
      freeCoachRosterId: freeCoach.id,
      selectionId: selection!.id,
      categoryId: category!.id,
      emptyCategoryId: emptyCategory!.id,
      videoId: video!.id,
    });
  }

  return {
    slug,
    orgId: org!.id,
    adminToken: await loginUser(organizer.id),
    dancerToken: await loginUser(dancer.id),
    events: data,
  };
}

async function setOverrides(
  eventId: string,
  capabilityOverrides: CapabilityOverrides
) {
  await db
    .update(orgEvents)
    .set({ capabilityOverrides })
    .where(eq(orgEvents.id, eventId))
    .execute();
}

/** Only one Org Event may be active per Org, so activating is a swap. */
async function activate(orgId: string, eventId: string) {
  await db
    .update(orgEvents)
    .set({ isActive: false })
    .where(eq(orgEvents.orgId, orgId))
    .execute();
  await db
    .update(orgEvents)
    .set({ isActive: true })
    .where(eq(orgEvents.id, eventId))
    .execute();
}

/**
 * One gated route. `event` says how the route learns its Org Event: `named`
 * routes carry it in the path or `eventId`, `active` routes act on the Org's
 * active event.
 */
interface GatedRoute {
  capability: EventTierCapability;
  who: "dancer" | "admin";
  event: "named" | "active";
  label: string;
  send(client: ApiClient, slug: string, data: EventData): ApiRequest;
}

const base = (slug: string, data: EventData) =>
  `/orgs/${slug}/events/${data.event.id}`;

/**
 * Every route behind the three capabilities. Writes are ordered so that each
 * one still has something to act on when it runs against the same event.
 */
const GATED_ROUTES: GatedRoute[] = [
  // Check-in
  {
    capability: "check_in",
    who: "dancer",
    event: "named",
    label: "GET check-in/status",
    send: (client, slug, data) =>
      client.get(`${base(slug, data)}/check-in/status`),
  },
  {
    capability: "check_in",
    who: "dancer",
    event: "named",
    label: "POST check-in",
    send: (client, slug, data) => client.post(`${base(slug, data)}/check-in`),
  },
  {
    capability: "check_in",
    who: "admin",
    event: "named",
    label: "POST rosters/:rosterId/check-in",
    send: (client, slug, data) =>
      client.post(
        `${base(slug, data)}/rosters/${data.dancerRosterId}/check-in`
      ),
  },
  {
    capability: "check_in",
    who: "admin",
    event: "named",
    label: "POST rosters/check-in/reset",
    send: (client, slug, data) =>
      client.post(`${base(slug, data)}/rosters/check-in/reset`),
  },

  // School selections
  {
    capability: "school_selections",
    who: "dancer",
    event: "named",
    label: "GET schools",
    send: (client, slug, data) =>
      client.get(`/orgs/${slug}/schools`).qs({ eventId: data.event.id }),
  },
  {
    capability: "school_selections",
    who: "dancer",
    event: "named",
    label: "GET my-selections",
    send: (client, slug, data) =>
      client.get(`/orgs/${slug}/my-selections`).qs({ eventId: data.event.id }),
  },
  {
    capability: "school_selections",
    who: "dancer",
    event: "active",
    label: "POST my-selections",
    send: (client, slug, data) =>
      client
        .post(`/orgs/${slug}/my-selections`)
        .json({ coachRosterId: data.freeCoachRosterId }),
  },
  {
    capability: "school_selections",
    who: "dancer",
    event: "active",
    label: "DELETE my-selections/:id",
    send: (client, slug, data) =>
      client.delete(`/orgs/${slug}/my-selections/${data.selectionId}`),
  },

  // Video library — a Dancer's reads
  {
    capability: "video_library",
    who: "dancer",
    event: "named",
    label: "GET video-categories",
    send: (client, slug, data) =>
      client.get(`${base(slug, data)}/video-categories`),
  },
  {
    capability: "video_library",
    who: "dancer",
    event: "named",
    label: "GET videos",
    send: (client, slug, data) => client.get(`${base(slug, data)}/videos`),
  },

  // Video library — managed by the Org's admins
  {
    capability: "video_library",
    who: "admin",
    event: "named",
    label: "admin GET video-categories",
    send: (client, slug, data) =>
      client.get(`${base(slug, data)}/video-categories`),
  },
  {
    capability: "video_library",
    who: "admin",
    event: "named",
    label: "admin GET videos",
    send: (client, slug, data) => client.get(`${base(slug, data)}/videos`),
  },
  {
    capability: "video_library",
    who: "admin",
    event: "named",
    label: "POST video-categories",
    send: (client, slug, data) =>
      client
        .post(`${base(slug, data)}/video-categories`)
        .json({ name: "Warmups" }),
  },
  {
    capability: "video_library",
    who: "admin",
    event: "named",
    label: "DELETE video-categories/:categoryId",
    send: (client, slug, data) =>
      client.delete(
        `${base(slug, data)}/video-categories/${data.emptyCategoryId}`
      ),
  },
  {
    capability: "video_library",
    who: "admin",
    event: "named",
    label: "POST videos",
    send: (client, slug, data) =>
      client.post(`${base(slug, data)}/videos`).json({
        title: "Tap combo",
        categoryId: data.categoryId,
        youtubeId: "9bZkp7q19f0",
      }),
  },
  {
    capability: "video_library",
    who: "admin",
    event: "named",
    label: "PATCH videos/:videoId",
    send: (client, slug, data) =>
      client.patch(`${base(slug, data)}/videos/${data.videoId}`).json({
        title: "Jazz combo, slower",
        categoryId: data.categoryId,
        youtubeId: "dQw4w9WgXcQ",
      }),
  },
  {
    capability: "video_library",
    who: "admin",
    event: "named",
    label: "DELETE videos/:videoId",
    send: (client, slug, data) =>
      client.delete(`${base(slug, data)}/videos/${data.videoId}`),
  },
  {
    capability: "video_library",
    who: "admin",
    event: "named",
    label: "POST videos/audio-upload-url",
    send: (client, slug, data) =>
      client
        .post(`${base(slug, data)}/videos/audio-upload-url`)
        .json({ contentType: "audio/mpeg", filename: "combo.mp3" }),
  },
];

async function call(
  client: ApiClient,
  fixture: Fixture,
  route: GatedRoute,
  data: EventData
) {
  const token =
    route.who === "admin" ? fixture.adminToken : fixture.dancerToken;
  const res = await route
    .send(client, fixture.slug, data)
    .header("Authorization", `Bearer ${token}`);
  const body = res.body() as { message?: unknown } | undefined;
  return {
    status: res.status(),
    // `OrgFeatureMiddleware` answers exactly this, so a route that 404s for
    // its own reasons (a row that is not there) is not mistaken for the gate.
    gated: res.status() === 404 && body?.message === "Not found.",
  };
}

test.group(
  "Event Tier capabilities on check-in, selections and videos",
  (group) => {
    group.each.setup(async () => {
      await db.delete(eventSchoolSelections).execute();
      await db.delete(eventVideos).execute();
      await db.delete(eventVideoCategories).execute();
      await db.delete(eventRosters).execute();
      await db.delete(orgEvents).execute();
      await db.delete(orgMemberships).execute();
      await db.delete(dancerProfiles).execute();
      await db.delete(schoolProfiles).execute();
      await db.delete(users).execute();
      await db.delete(organizations).execute();
    });

    test("every route 404s at a Core event, the way callbacks do", async ({
      client,
      assert,
    }) => {
      const fixture = await orgWithEvents("core-gates", ["core"]);
      const [core] = fixture.events;

      for (const route of GATED_ROUTES) {
        const { status, gated } = await call(client, fixture, route, core!);
        assert.isTrue(gated, `${route.label} answered ${status}`);
      }
    });

    test("a grandfathered Enterprise event keeps every route", async ({
      client,
      assert,
    }) => {
      const fixture = await orgWithEvents("enterprise-gates", ["enterprise"]);
      const [enterprise] = fixture.events;

      for (const route of GATED_ROUTES) {
        const { status } = await call(client, fixture, route, enterprise!);
        assert.isBelow(status, 300, `${route.label} answered ${status}`);
      }
    });

    test("each Event Tier opens exactly the routes of the capabilities it includes", async ({
      client,
      assert,
    }) => {
      for (const eventTier of ["regional", "national"] as const) {
        const fixture = await orgWithEvents(`${eventTier}-gates`, [eventTier]);
        const [data] = fixture.events;

        for (const route of GATED_ROUTES) {
          const { status, gated } = await call(client, fixture, route, data!);
          assert.equal(
            !gated,
            eventTierIncludes(eventTier, route.capability),
            `${eventTier} ${route.label} answered ${status}`
          );
        }
      }
    });

    test("a staff override on the event wins over its Event Tier, in either direction", async ({
      client,
      assert,
    }) => {
      const allOn = Object.fromEntries(
        EVENT_TIER_CAPABILITIES.map((capability) => [capability, true])
      ) as CapabilityOverrides;
      const allOff = Object.fromEntries(
        EVENT_TIER_CAPABILITIES.map((capability) => [capability, false])
      ) as CapabilityOverrides;

      const granted = await orgWithEvents("overridden-core", ["core"]);
      await setOverrides(granted.events[0]!.event.id, allOn);
      for (const route of GATED_ROUTES) {
        const { status } = await call(
          client,
          granted,
          route,
          granted.events[0]!
        );
        assert.isBelow(
          status,
          300,
          `granted ${route.label} answered ${status}`
        );
      }

      const denied = await orgWithEvents("overridden-enterprise", [
        "enterprise",
      ]);
      await setOverrides(denied.events[0]!.event.id, allOff);
      for (const route of GATED_ROUTES) {
        const { status, gated } = await call(
          client,
          denied,
          route,
          denied.events[0]!
        );
        assert.isTrue(gated, `denied ${route.label} answered ${status}`);
      }
    });

    test("a route that names its event gates on that event, not the Org's active one", async ({
      client,
      assert,
    }) => {
      const named = GATED_ROUTES.filter((route) => route.event === "named");

      // The Enterprise event is active, so anything reading the active event
      // would let every request at the Core event through.
      const coreAsked = await orgWithEvents("named-core", [
        "enterprise",
        "core",
      ]);
      for (const route of named) {
        const { status, gated } = await call(
          client,
          coreAsked,
          route,
          coreAsked.events[1]!
        );
        assert.isTrue(gated, `core asked: ${route.label} answered ${status}`);
      }

      // And the other way round: a Core active event does not shut the door on
      // an Enterprise event the request names.
      const enterpriseAsked = await orgWithEvents("named-enterprise", [
        "core",
        "enterprise",
      ]);
      for (const route of named) {
        const { status } = await call(
          client,
          enterpriseAsked,
          route,
          enterpriseAsked.events[1]!
        );
        assert.isBelow(
          status,
          300,
          `enterprise asked: ${route.label} answered ${status}`
        );
      }
    });

    test("a route acting on the active event gates on the active event", async ({
      client,
      assert,
    }) => {
      const active = GATED_ROUTES.filter((route) => route.event === "active");
      const fixture = await orgWithEvents("active-swap", [
        "core",
        "enterprise",
      ]);
      const [core, enterprise] = fixture.events;

      await activate(fixture.orgId, core!.event.id);
      for (const route of active) {
        const { status, gated } = await call(client, fixture, route, core!);
        assert.isTrue(gated, `core active: ${route.label} answered ${status}`);
      }

      await activate(fixture.orgId, enterprise!.event.id);
      for (const route of active) {
        const { status } = await call(client, fixture, route, enterprise!);
        assert.isBelow(
          status,
          300,
          `enterprise active: ${route.label} answered ${status}`
        );
      }
    });

    test("an admin route naming another Org's event is not found", async ({
      client,
      assert,
    }) => {
      const mine = await orgWithEvents("mine-org", ["enterprise"]);
      const theirs = await orgWithEvents("their-org", ["enterprise"]);
      const admin = GATED_ROUTES.filter((route) => route.who === "admin");

      for (const route of admin) {
        const res = await route
          .send(client, mine.slug, theirs.events[0]!)
          .header("Authorization", `Bearer ${mine.adminToken}`);
        assert.equal(
          res.status(),
          404,
          `${route.label} answered ${res.status()}`
        );
      }
    });

    test("an event id that is not a UUID is not found rather than an error", async ({
      client,
    }) => {
      const fixture = await orgWithEvents("malformed-org", ["enterprise"]);

      const res = await client
        .get(`/orgs/${fixture.slug}/events/not-an-event/videos`)
        .header("Authorization", `Bearer ${fixture.adminToken}`);

      res.assertStatus(404);
    });
  }
);
