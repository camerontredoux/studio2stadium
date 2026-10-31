import { db } from "#database/connection";
import {
  eventAuditLog,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { createDancer, login } from "#tests/helpers/premium";
import { test } from "@japa/runner";
import { eq } from "drizzle-orm";
import { signCheckInCode, verifyCheckInCode } from "../check-in-code.ts";

async function fixture() {
  const [admin, dancer, otherDancer] = await Promise.all([
    createDancer(),
    createDancer(),
    createDancer(),
  ]);
  const [org, otherOrg] = await db
    .insert(organizations)
    .values([
      { name: "Scan Org", slug: "scan-org", features: { check_in: true } },
      { name: "Other Org", slug: "scan-other", features: { check_in: true } },
    ])
    .returning();
  await db.insert(orgMemberships).values([
    { orgId: org!.id, userId: admin.id, role: "admin", type: "organizer" },
    { orgId: org!.id, userId: dancer.id, role: "member", type: "dancer" },
    { orgId: org!.id, userId: otherDancer.id, role: "member", type: "dancer" },
  ]);
  const [event] = await db
    .insert(orgEvents)
    .values({
      orgId: org!.id,
      name: "Scan Event",
      startDate: "2026-06-01",
      endDate: "2026-06-02",
      isActive: true,
    })
    .returning();
  const [roster, otherRoster] = await db
    .insert(eventRosters)
    .values([
      {
        eventId: event!.id,
        userId: dancer.id,
        type: "dancer" as const,
        email: dancer.email,
        firstName: "Sam",
        lastName: "Scan",
        bibNumber: 101,
      },
      {
        eventId: event!.id,
        userId: otherDancer.id,
        type: "dancer" as const,
        email: otherDancer.email,
        firstName: "Olly",
        lastName: "Other",
        bibNumber: 102,
      },
    ])
    .returning();
  return {
    admin,
    dancer,
    org: org!,
    otherOrg: otherOrg!,
    event: event!,
    roster: roster!,
    otherRoster: otherRoster!,
  };
}

test.group("POST /orgs/:slug/events/:id/check-in/scan", (group) => {
  group.each.setup(async () => {
    await db.delete(eventAuditLog);
    await db.delete(organizations);
    await db.delete(users);
  });

  test("an admin checks a dancer in, then a repeat scan changes nothing", async ({
    client,
    assert,
  }) => {
    const { admin, org, event, roster } = await fixture();
    const token = await login(client, admin.email);
    const url = `/orgs/${org.slug}/events/${event.id}/check-in/scan`;
    const code = signCheckInCode(roster.id, event.id);

    const first = await client.post(url).bearerToken(token).json({ code });
    first.assertStatus(200);
    assert.equal(first.body().result, "checked_in");
    assert.equal(first.body().roster.bib, 101);

    const second = await client.post(url).bearerToken(token).json({ code });
    second.assertStatus(200);
    assert.equal(second.body().result, "already_checked_in");
    assert.equal(
      second.body().roster.checkedInAt,
      first.body().roster.checkedInAt
    );
  });

  test("error codes for a tampered code and an unknown string", async ({
    client,
  }) => {
    const { admin, org, event, roster } = await fixture();
    const token = await login(client, admin.email);
    const url = `/orgs/${org.slug}/events/${event.id}/check-in/scan`;
    const code = signCheckInCode(roster.id, event.id);
    const tampered = code.slice(0, -1) + (code.at(-1) === "A" ? "B" : "A");

    const bad = await client
      .post(url)
      .bearerToken(token)
      .json({ code: tampered });
    bad.assertStatus(422);
    bad.assertBodyContains({ code: "E_CHECK_IN_CODE_INVALID" });

    const random = await client
      .post(url)
      .bearerToken(token)
      .json({ code: "https://example.com" });
    random.assertStatus(422);
    random.assertBodyContains({ code: "E_CHECK_IN_CODE_INVALID" });
  });

  test("another org's slug cannot scan this org's event", async ({
    client,
  }) => {
    const { admin, otherOrg, event, roster } = await fixture();
    await db.insert(orgMemberships).values({
      orgId: otherOrg.id,
      userId: admin.id,
      role: "admin",
      type: "organizer",
    });
    const token = await login(client, admin.email);
    const res = await client
      .post(`/orgs/${otherOrg.slug}/events/${event.id}/check-in/scan`)
      .bearerToken(token)
      .json({ code: signCheckInCode(roster.id, event.id) });
    res.assertStatus(404);
  });

  test("a non-admin member gets 403", async ({ client }) => {
    const { dancer, org, event, roster } = await fixture();
    const token = await login(client, dancer.email);
    const res = await client
      .post(`/orgs/${org.slug}/events/${event.id}/check-in/scan`)
      .bearerToken(token)
      .json({ code: signCheckInCode(roster.id, event.id) });
    res.assertStatus(403);
  });

  test("the dancer's status carries their own code and nobody else's", async ({
    client,
    assert,
  }) => {
    const { dancer, org, event, roster, otherRoster } = await fixture();
    const token = await login(client, dancer.email);
    const res = await client
      .get(`/orgs/${org.slug}/events/${event.id}/check-in/status`)
      .bearerToken(token);
    res.assertStatus(200);
    const code = res.body().checkInCode as string;
    assert.deepEqual(verifyCheckInCode(code), {
      rosterId: roster.id,
      eventId: event.id,
    });
    assert.notEqual(code, signCheckInCode(otherRoster.id, event.id));
    assert.isAtMost(code.length, 100);
    assert.strictEqual(res.body().bibNumber, 101);
  });

  test("no pass when the event does not have check-in", async ({ client }) => {
    const { dancer, org, event } = await fixture();
    await db
      .update(orgEvents)
      .set({ capabilityOverrides: { check_in: false } })
      .where(eq(orgEvents.id, event.id));
    const token = await login(client, dancer.email);
    const res = await client
      .get(`/orgs/${org.slug}/events/${event.id}/check-in/status`)
      .bearerToken(token);
    res.assertStatus(404);
  });
});
