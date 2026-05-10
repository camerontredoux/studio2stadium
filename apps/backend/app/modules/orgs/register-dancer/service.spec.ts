import { test } from "@japa/runner";
import { and, eq } from "drizzle-orm";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import {
  dancerInvites,
  organizations,
  orgMemberships,
  premiumGrants,
} from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { seedOrganizations } from "#commands/backfill-organizations";

test.group("POST /orgs/:slug/register", (group) => {
  group.each.setup(async () => {
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(premiumGrants).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(dancerInvites).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();
  });

  test("consumes a valid invite, creates user + membership + grant", async ({
    client,
    assert,
  }) => {
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    await db.insert(dancerInvites).values({
      orgId: summit!.id,
      email: "newdancer@example.com",
      token: "tok_valid_abcdef01",
      expiresAt: new Date(Date.now() + 86400000),
    });

    const res = await client.post("/orgs/summit/register").json({
      token: "tok_valid_abcdef01",
      firstName: "New",
      lastName: "Dancer",
      password: "CorrectHorse1!",
    });
    res.assertStatus(201);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, "newdancer@example.com"));
    assert.exists(user);
    assert.equal(user!.firstName, "New");
    assert.equal(user!.type, "dancer");
    assert.isTrue(user!.verified);

    const [membership] = await db
      .select()
      .from(orgMemberships)
      .where(
        and(
          eq(orgMemberships.userId, user!.id),
          eq(orgMemberships.orgId, summit!.id)
        )
      );
    assert.exists(membership);
    assert.equal(membership!.type, "dancer");
    assert.equal(membership!.role, "member");

    const [grant] = await db
      .select()
      .from(premiumGrants)
      .where(eq(premiumGrants.userId, user!.id));
    assert.exists(grant);
    assert.equal(grant!.sourceType, "org_event");
    // Summit's settings.premium_period_days = 90
    const daysUntilExpiry =
      (grant!.expiresAt.getTime() - Date.now()) / 86400000;
    assert.closeTo(daysUntilExpiry, 90, 1);

    const [invite] = await db
      .select()
      .from(dancerInvites)
      .where(eq(dancerInvites.token, "tok_valid_abcdef01"));
    assert.exists(invite!.consumedAt);
  });

  test("rejects an expired token", async ({ client }) => {
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    await db.insert(dancerInvites).values({
      orgId: summit!.id,
      email: "old@example.com",
      token: "tok_expired_01234",
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = await client.post("/orgs/summit/register").json({
      token: "tok_expired_01234",
      firstName: "Old",
      lastName: "Dancer",
      password: "CorrectHorse1!",
    });
    res.assertStatus(400);
  });

  test("rejects a token bound to a different org", async ({ client }) => {
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    await db.insert(dancerInvites).values({
      orgId: summit!.id,
      email: "wrong@example.com",
      token: "tok_wrongorg_01",
      expiresAt: new Date(Date.now() + 86400000),
    });
    const res = await client.post("/orgs/prodigy/register").json({
      token: "tok_wrongorg_01",
      firstName: "Wrong",
      lastName: "Org",
      password: "CorrectHorse1!",
    });
    res.assertStatus(400);
  });

  test("rejects an already-consumed token", async ({ client }) => {
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    await db.insert(dancerInvites).values({
      orgId: summit!.id,
      email: "repeat@example.com",
      token: "tok_repeat_abc01",
      expiresAt: new Date(Date.now() + 86400000),
      consumedAt: new Date(),
    });
    const res = await client.post("/orgs/summit/register").json({
      token: "tok_repeat_abc01",
      firstName: "Re",
      lastName: "Peat",
      password: "CorrectHorse1!",
    });
    res.assertStatus(400);
  });

  test("links all matching pending roster rows in the same org", async ({
    client,
    assert,
  }) => {
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));

    const [event1] = await db
      .insert(orgEvents)
      .values({
        orgId: summit!.id,
        name: "Event One",
        startDate: "2026-06-01",
        endDate: "2026-06-02",
      })
      .returning();
    const [event2] = await db
      .insert(orgEvents)
      .values({
        orgId: summit!.id,
        name: "Event Two",
        startDate: "2026-07-01",
        endDate: "2026-07-02",
      })
      .returning();

    await db.insert(eventRosters).values([
      {
        eventId: event1!.id,
        type: "dancer",
        email: "linkme@example.com",
        firstName: "Link",
        lastName: "Me",
      },
      {
        eventId: event2!.id,
        type: "dancer",
        email: "linkme@example.com",
        firstName: "Link",
        lastName: "Me",
      },
    ]);

    await db.insert(dancerInvites).values({
      orgId: summit!.id,
      email: "linkme@example.com",
      token: "tok_link_abcdef01",
      expiresAt: new Date(Date.now() + 86400000),
    });

    const res = await client.post("/orgs/summit/register").json({
      token: "tok_link_abcdef01",
      firstName: "Link",
      lastName: "Me",
      password: "CorrectHorse1!",
    });
    res.assertStatus(201);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, "linkme@example.com"));

    const linkedRosters = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.email, "linkme@example.com"));

    assert.lengthOf(linkedRosters, 2);
    for (const row of linkedRosters) {
      assert.equal(row.userId, user!.id);
    }
  });

  test("does not link roster rows in other orgs", async ({
    client,
    assert,
  }) => {
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    const [prodigy] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "prodigy"));

    const [prodigyEvent] = await db
      .insert(orgEvents)
      .values({
        orgId: prodigy!.id,
        name: "Prodigy Event",
        startDate: "2026-06-01",
        endDate: "2026-06-02",
      })
      .returning();
    await db.insert(eventRosters).values({
      eventId: prodigyEvent!.id,
      type: "dancer",
      email: "multi@example.com",
      firstName: "Multi",
      lastName: "Org",
    });

    await db.insert(dancerInvites).values({
      orgId: summit!.id,
      email: "multi@example.com",
      token: "tok_multi_abcdef1",
      expiresAt: new Date(Date.now() + 86400000),
    });

    const res = await client.post("/orgs/summit/register").json({
      token: "tok_multi_abcdef1",
      firstName: "Multi",
      lastName: "Org",
      password: "CorrectHorse1!",
    });
    res.assertStatus(201);

    const [prodigyRow] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.eventId, prodigyEvent!.id));
    assert.isNull(prodigyRow!.userId);
  });

  test("registration still succeeds when there are no matching roster rows", async ({
    client,
  }) => {
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    await db.insert(dancerInvites).values({
      orgId: summit!.id,
      email: "noroster@example.com",
      token: "tok_noros_abcdef1",
      expiresAt: new Date(Date.now() + 86400000),
    });

    const res = await client.post("/orgs/summit/register").json({
      token: "tok_noros_abcdef1",
      firstName: "No",
      lastName: "Roster",
      password: "CorrectHorse1!",
    });
    res.assertStatus(201);
  });
});
