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
import { eventTierIncludes, type EventTier } from "#shared/org/event-tiers";
import type { CapabilityOverrides } from "#shared/org/entitlement";
import redis from "@adonisjs/redis/services/main";
import { MessageBuilder } from "@adonisjs/core/helpers";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

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

/**
 * An Org whose `features` JSONB is deliberately empty, with one event per Event
 * Tier asked for. Entitlement has to come from the event, so an org that grants
 * nothing is the honest starting point — anything the coach can reach is
 * something the Org Event gave them.
 */
async function orgWithEvents(slug: string, eventTiers: EventTier[]) {
  const [org] = await db
    .insert(organizations)
    .values({ name: slug, slug, features: {} })
    .returning();

  const events = await db
    .insert(orgEvents)
    .values(
      eventTiers.map((eventTier, index) => ({
        orgId: org!.id,
        name: `${slug} ${eventTier}`,
        startDate: dateFromToday(index * 10 - 1),
        endDate: dateFromToday(index * 10 + 1),
        // Only one event may be active at a time, so the first one starts as
        // the active event and later tests flip it.
        isActive: index === 0,
        eventTier,
      }))
    )
    .returning();

  const coach = await createUser(`${slug.replace(/-/g, "_")}_coach`, "school");
  await db.insert(orgMemberships).values({
    orgId: org!.id,
    userId: coach.id,
    role: "member",
    type: "coach",
  });
  await db.insert(eventRosters).values(
    events.map((event) => ({
      eventId: event.id,
      userId: coach.id,
      type: "coach" as const,
      email: coach.email,
      firstName: "Event",
      lastName: "Coach",
    }))
  );

  return { org: org!, events, token: await loginUser(coach.id) };
}

/** Sets one Org Event's staff exceptions, as the admin endpoint would. */
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

test.group("Event Tier entitlement", (group) => {
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

  test("a gated route answers at an Event Tier that includes the capability", async ({
    client,
  }) => {
    const { org, token } = await orgWithEvents("regional-org", ["regional"]);

    const res = await client
      .get(`/orgs/${org.slug}/callbacks`)
      .header("Authorization", `Bearer ${token}`);

    res.assertStatus(200);
  });

  test("a gated route 404s at an Event Tier that does not", async ({
    client,
  }) => {
    const { org, token } = await orgWithEvents("core-org", ["core"]);

    const res = await client
      .get(`/orgs/${org.slug}/callbacks`)
      .header("Authorization", `Bearer ${token}`);

    res.assertStatus(404);
  });

  test("two events under one Org gate independently of each other", async ({
    client,
  }) => {
    const { org, events, token } = await orgWithEvents("mixed-org", [
      "core",
      "national",
    ]);
    const [coreEvent, nationalEvent] = events;

    await activate(org.id, coreEvent!.id);
    const atCore = await client
      .get(`/orgs/${org.slug}/callbacks`)
      .header("Authorization", `Bearer ${token}`);
    atCore.assertStatus(404);

    await activate(org.id, nationalEvent!.id);
    const atNational = await client
      .get(`/orgs/${org.slug}/callbacks`)
      .header("Authorization", `Bearer ${token}`);
    atNational.assertStatus(200);
  });

  test("an explicit override on the event wins over what its Event Tier includes", async ({
    client,
  }) => {
    // Turned on for an event that did not buy it.
    const core = await orgWithEvents("flagged-core-org", ["core"]);
    await setOverrides(core.events[0]!.id, { callbacks: true });
    const granted = await client
      .get(`/orgs/${core.org.slug}/callbacks`)
      .header("Authorization", `Bearer ${core.token}`);
    granted.assertStatus(200);

    // Turned off for an event that did — which is how every Org configured
    // before Event Tiers existed keeps the access it was given.
    const enterprise = await orgWithEvents("flagged-enterprise-org", [
      "enterprise",
    ]);
    await setOverrides(enterprise.events[0]!.id, { callbacks: false });
    const denied = await client
      .get(`/orgs/${enterprise.org.slug}/callbacks`)
      .header("Authorization", `Bearer ${enterprise.token}`);
    denied.assertStatus(404);
  });

  test("two events under one Org at the same Event Tier can carry different overrides", async ({
    client,
    assert,
  }) => {
    const { org, events, token } = await orgWithEvents("differing-org", [
      "enterprise",
      "enterprise",
    ]);
    const [spring, summer] = events;
    await setOverrides(spring!.id, { callbacks: false });

    await activate(org.id, spring!.id);
    const atSpring = await client
      .get(`/orgs/${org.slug}/callbacks`)
      .header("Authorization", `Bearer ${token}`);
    atSpring.assertStatus(404);
    const springPayload = await client
      .get(`/orgs/${org.slug}`)
      .header("Authorization", `Bearer ${token}`);
    assert.notInclude(
      springPayload.body().activeEventCapabilities as string[],
      "callbacks"
    );

    await activate(org.id, summer!.id);
    const atSummer = await client
      .get(`/orgs/${org.slug}/callbacks`)
      .header("Authorization", `Bearer ${token}`);
    atSummer.assertStatus(200);
    const summerPayload = await client
      .get(`/orgs/${org.slug}`)
      .header("Authorization", `Bearer ${token}`);
    assert.include(
      summerPayload.body().activeEventCapabilities as string[],
      "callbacks"
    );
  });

  test("a capability flag left on the Org decides nothing", async ({
    client,
  }) => {
    const { org, token } = await orgWithEvents("org-flag-org", ["core"]);
    await db
      .update(organizations)
      .set({ features: { callbacks: true } })
      .where(eq(organizations.id, org.id))
      .execute();

    const res = await client
      .get(`/orgs/${org.slug}/callbacks`)
      .header("Authorization", `Bearer ${token}`);
    res.assertStatus(404);
  });

  test("the org payload and the active-event gate agree for every override", async ({
    client,
    assert,
  }) => {
    // A Coach is gated on the Org's active event, and the frontend reads that
    // answer from `activeEventCapabilities`. Both must agree for every Event
    // Tier crossed with every override.
    const { org, events, token } = await orgWithEvents("coach-agreement-org", [
      "core",
      "regional",
      "national",
      "enterprise",
    ]);
    const overrides: CapabilityOverrides[] = [
      {},
      { callbacks: true },
      { callbacks: false },
    ];
    for (const event of events) {
      await activate(org.id, event.id);
      for (const capabilityOverrides of overrides) {
        await setOverrides(event.id, capabilityOverrides);
        const label = `tier=${event.eventTier} overrides=${JSON.stringify(capabilityOverrides)}`;

        const payload = await client
          .get(`/orgs/${org.slug}`)
          .header("Authorization", `Bearer ${token}`);
        payload.assertStatus(200);
        const shown = (
          payload.body().activeEventCapabilities as string[]
        ).includes("callbacks");

        const gated = await client
          .get(`/orgs/${org.slug}/callbacks`)
          .header("Authorization", `Bearer ${token}`);
        const served = gated.status() === 200;
        if (!served) assert.equal(gated.status(), 404, label);

        const expected =
          capabilityOverrides.callbacks ??
          eventTierIncludes(event.eventTier, "callbacks");
        assert.equal(shown, expected, `payload: ${label}`);
        assert.equal(served, expected, `middleware: ${label}`);
      }
    }
  });

  test("a Dancer reading her own event gates on the event she asked for", async ({
    client,
  }) => {
    // `orgEvent("dancerSelfRead")` resolves the *requested* event rather than
    // the Org's active one, so entitlement follows the event the Dancer is
    // actually looking at. With a switcher across events of different Event
    // Tiers, that is the answer that matches what she is being shown.
    const { org, events } = await orgWithEvents("dancer-org", [
      "core",
      "national",
    ]);
    const [coreEvent, nationalEvent] = events;
    const dancer = await createUser("switching_dancer", "dancer");
    await db.insert(orgMemberships).values({
      orgId: org.id,
      userId: dancer.id,
      role: "member",
      type: "dancer",
    });
    await db.insert(eventRosters).values(
      events.map((event) => ({
        eventId: event.id,
        userId: dancer.id,
        type: "dancer" as const,
        email: dancer.email,
        firstName: "Switching",
        lastName: "Dancer",
      }))
    );
    const token = await loginUser(dancer.id);

    // The Core event is the active one, so anything reading the active event
    // would answer Core for both requests.
    await activate(org.id, coreEvent!.id);

    const atCore = await client
      .get(`/orgs/${org.slug}/dancer/callbacks`)
      .qs({ eventId: coreEvent!.id })
      .header("Authorization", `Bearer ${token}`);
    atCore.assertStatus(404);

    const atNational = await client
      .get(`/orgs/${org.slug}/dancer/callbacks`)
      .qs({ eventId: nationalEvent!.id })
      .header("Authorization", `Bearer ${token}`);
    atNational.assertStatus(200);
  });

  test("the org payload and the Dancer's gated route agree for every active and requested event", async ({
    client,
    assert,
  }) => {
    // The frontend gates a Dancer's menu and route guards on the capabilities
    // `GET /orgs/{slug}` reports for the event she is viewing (#110). That
    // answer has to match what `orgFeature` enforces on the same request, for
    // every pairing of the Org's active event with the one she asked for, and
    // with or without a staff override on either event.
    const { org, events } = await orgWithEvents("agreement-org", [
      "core",
      "national",
    ]);
    const dancer = await createUser("agreement_dancer", "dancer");
    await db.insert(orgMemberships).values({
      orgId: org.id,
      userId: dancer.id,
      role: "member",
      type: "dancer",
    });
    await db.insert(eventRosters).values(
      events.map((event) => ({
        eventId: event.id,
        userId: dancer.id,
        type: "dancer" as const,
        email: dancer.email,
        firstName: "Agreement",
        lastName: "Dancer",
      }))
    );
    const token = await loginUser(dancer.id);

    const overrides: CapabilityOverrides[] = [
      {},
      { callbacks: true },
      { callbacks: false },
    ];
    // Each event takes each override independently, so the two events differ
    // in most rounds.
    const [coreEvent, nationalEvent] = events;
    const rounds = overrides.flatMap((onCore) =>
      overrides.map((onNational) => ({ onCore, onNational }))
    );
    for (const { onCore, onNational } of rounds) {
      await setOverrides(coreEvent!.id, onCore);
      await setOverrides(nationalEvent!.id, onNational);
      const overridesOf = (eventId: string) =>
        eventId === coreEvent!.id ? onCore : onNational;

      for (const active of events) {
        await activate(org.id, active.id);

        for (const requested of events) {
          const label = `core=${JSON.stringify(onCore)} national=${JSON.stringify(onNational)} active=${active.eventTier} requested=${requested.eventTier}`;

          const payload = await client
            .get(`/orgs/${org.slug}`)
            .header("Authorization", `Bearer ${token}`);
          payload.assertStatus(200);
          const roster = (
            payload.body().myRosters as Array<{
              eventId: string;
              capabilities: string[];
            }>
          ).find((candidate) => candidate.eventId === requested.id);
          const shown = roster?.capabilities.includes("callbacks") ?? false;

          const gated = await client
            .get(`/orgs/${org.slug}/dancer/callbacks`)
            .qs({ eventId: requested.id })
            .header("Authorization", `Bearer ${token}`);
          const served = gated.status() === 200;
          if (!served) assert.equal(gated.status(), 404, label);

          // Agreement alone would pass if both were wrong the same way, so
          // pin the answer too: the requested event's override if staff set
          // one, else its Event Tier — never the active event's.
          const expected =
            overridesOf(requested.id).callbacks ??
            requested.eventTier === "national";
          assert.equal(shown, expected, `payload: ${label}`);
          assert.equal(served, expected, `middleware: ${label}`);
        }
      }
    }
  });

  test("a grandfathered Enterprise event keeps the access it had", async ({
    client,
  }) => {
    // Every Org Event that predates billing is stamped Enterprise (ADR 0006),
    // including ones whose org grants nothing through `features`.
    const { org, token } = await orgWithEvents("grandfathered-org", [
      "enterprise",
    ]);

    const res = await client
      .get(`/orgs/${org.slug}/callbacks`)
      .header("Authorization", `Bearer ${token}`);

    res.assertStatus(200);
  });
});
