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
import type { EventTier } from "#shared/org/event-tiers";
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

  test("an explicit org flag overrides what the Event Tier includes", async ({
    client,
  }) => {
    // Turned on for an event that did not buy it.
    const core = await orgWithEvents("flagged-core-org", ["core"]);
    await db
      .update(organizations)
      .set({ features: { callbacks: true } })
      .where(eq(organizations.id, core.org.id))
      .execute();
    const granted = await client
      .get(`/orgs/${core.org.slug}/callbacks`)
      .header("Authorization", `Bearer ${core.token}`);
    granted.assertStatus(200);

    // Turned off for an event that did — which is how every Org configured
    // before Event Tiers existed keeps the access it was given.
    const enterprise = await orgWithEvents("flagged-enterprise-org", [
      "enterprise",
    ]);
    await db
      .update(organizations)
      .set({ features: { callbacks: false } })
      .where(eq(organizations.id, enterprise.org.id))
      .execute();
    const denied = await client
      .get(`/orgs/${enterprise.org.slug}/callbacks`)
      .header("Authorization", `Bearer ${enterprise.token}`);
    denied.assertStatus(404);
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
