import { test } from "@japa/runner";
import { db } from "#database/connection";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { seedOrganizations } from "#commands/backfill-organizations";
import { users } from "#database/schema/users";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { GetOrgService } from "./service.ts";
import { DatabaseService } from "#database/service";
import { eq } from "drizzle-orm";

test.group("GET /orgs/:slug", (group) => {
  group.each.setup(async () => {
    await db.delete(organizations).execute();
    await seedOrganizations();
  });

  test("returns summit org metadata including branding and features", async ({
    client,
    assert,
  }) => {
    const response = await client.get("/orgs/summit");
    response.assertStatus(200);
    const body = response.body();
    assert.equal(body.slug, "summit");
    assert.equal(body.name, "Sharpen Up - The Summit");
    assert.equal(body.primaryColor, "#1a1a2e");
    assert.equal(body.accentColor, "#e94560");
    assert.isObject(body.features);
    assert.isTrue(body.features.callbacks);
    assert.isObject(body.settings);
    assert.equal(body.settings.max_school_selections, 3);
  });

  test("carries the active event's Event Tier and what it includes", async ({
    client,
    assert,
  }) => {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    const [event] = await db
      .insert(orgEvents)
      .values({
        orgId: org!.id,
        name: "Entitlement Event",
        startDate: "2026-09-01",
        endDate: "2026-09-02",
        isActive: true,
        eventTier: "regional",
      })
      .returning();

    const response = await client.get("/orgs/summit");
    response.assertStatus(200);
    const { activeEvent } = response.body();
    assert.equal(activeEvent.id, event!.id);
    assert.equal(activeEvent.eventTier, "regional");
    assert.sameMembers(activeEvent.capabilities, [
      "check_in",
      "school_selections",
      "callbacks",
    ]);
  });

  test("a Core active event includes none of the gated capabilities", async ({
    client,
    assert,
  }) => {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    await db.insert(orgEvents).values({
      orgId: org!.id,
      name: "Core Event",
      startDate: "2026-09-01",
      endDate: "2026-09-02",
      isActive: true,
      eventTier: "core",
    });

    const response = await client.get("/orgs/summit");
    response.assertStatus(200);
    // Empty rather than absent: the org's own flags say `callbacks: true`, and
    // a client that cannot tell "no capabilities" from "no answer" would fall
    // back to them.
    assert.deepEqual(response.body().activeEvent.capabilities, []);
  });

  test("activeEvent is null when the org has no active event", async ({
    client,
    assert,
  }) => {
    const response = await client.get("/orgs/core");
    response.assertStatus(200);
    assert.isNull(response.body().activeEvent);
  });

  test("returns 404 for unknown slug", async ({ client }) => {
    const response = await client.get("/orgs/does-not-exist");
    response.assertStatus(404);
  });

  test("is publicly accessible with no auth header", async ({
    client,
    assert,
  }) => {
    // No .loginAs() — bare request, must succeed.
    const response = await client.get("/orgs/core");
    response.assertStatus(200);
    assert.equal(response.body().slug, "core");
  });

  test("myRoster resolves to the nearest upcoming event when no active-event roster exists", async ({
    assert,
  }) => {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    const [dancer] = await db
      .insert(users)
      .values({
        username: `multi_event_dancer_${Date.now()}`,
        email: `multi_event_dancer_${Date.now()}@example.com`,
        displayEmail: "multi-event@example.com",
        firstName: "Multi",
        lastName: "Dancer",
        password: "hashed",
        role: "user",
        type: "dancer",
        verified: true,
      })
      .returning();
    await db.insert(orgMemberships).values({
      orgId: org!.id,
      userId: dancer!.id,
      role: "member",
      type: "dancer",
    });
    const today = new Date();
    const dateFromToday = (days: number) => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return date.toISOString().slice(0, 10);
    };
    const [farFuture, nearestFuture, past] = await db
      .insert(orgEvents)
      .values([
        {
          orgId: org!.id,
          name: "Far Future",
          startDate: dateFromToday(60),
          endDate: dateFromToday(62),
        },
        {
          orgId: org!.id,
          name: "Nearest Future",
          startDate: dateFromToday(10),
          endDate: dateFromToday(12),
        },
        {
          orgId: org!.id,
          name: "Past",
          startDate: dateFromToday(-30),
          endDate: dateFromToday(-28),
        },
      ])
      .returning();
    await db.insert(eventRosters).values(
      [farFuture, nearestFuture, past].map((event) => ({
        eventId: event!.id,
        userId: dancer!.id,
        type: "dancer" as const,
        email: dancer!.email,
        firstName: "Multi",
        lastName: "Dancer",
      }))
    );

    const result = await new GetOrgService(new DatabaseService()).execute(
      org!.slug,
      dancer!.id
    );

    assert.equal(result?.myRoster?.eventId, nearestFuture!.id);
    assert.equal(result?.myRoster?.eventName, "Nearest Future");
    assert.isFalse(result?.myRoster?.isActive);
    assert.isFalse(result?.myRoster?.hasStarted);
    assert.deepEqual(
      result?.myRosters.map((roster) => roster.eventId),
      [nearestFuture!.id, farFuture!.id, past!.id]
    );
  });
});
