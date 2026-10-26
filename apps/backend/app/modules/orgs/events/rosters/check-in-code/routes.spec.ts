import { db } from "#database/connection";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { createDancer, login } from "#tests/helpers/premium";
import { test } from "@japa/runner";
import { verifyCheckInCode } from "../../check-in/check-in-code.ts";

async function fixture() {
  const [admin, dancer] = await Promise.all([createDancer(), createDancer()]);
  const [org] = await db
    .insert(organizations)
    .values({
      name: "Code Org",
      slug: "code-org",
      features: { check_in: true },
    })
    .returning();
  await db.insert(orgMemberships).values([
    { orgId: org!.id, userId: admin.id, role: "admin", type: "organizer" },
    { orgId: org!.id, userId: dancer.id, role: "member", type: "dancer" },
  ]);
  const [event, otherEvent] = await db
    .insert(orgEvents)
    .values([
      {
        orgId: org!.id,
        name: "Code Event",
        startDate: "2026-06-01",
        endDate: "2026-06-02",
        isActive: true,
      },
      {
        orgId: org!.id,
        name: "Other Event",
        startDate: "2026-07-01",
        endDate: "2026-07-02",
      },
    ])
    .returning();
  const [roster, coachRoster, otherEventRoster] = await db
    .insert(eventRosters)
    .values([
      {
        eventId: event!.id,
        userId: dancer.id,
        type: "dancer" as const,
        email: dancer.email,
        firstName: "Jane",
        lastName: "Doe",
        bibNumber: 122,
      },
      {
        eventId: event!.id,
        type: "coach" as const,
        email: "coach@code-org.test",
        firstName: "Cora",
        lastName: "Coach",
      },
      {
        eventId: otherEvent!.id,
        type: "dancer" as const,
        email: "elsewhere@code-org.test",
        firstName: "Eli",
        lastName: "Elsewhere",
        bibNumber: 5,
      },
    ])
    .returning();
  return {
    admin,
    dancer,
    org: org!,
    event: event!,
    roster: roster!,
    coachRoster: coachRoster!,
    otherEventRoster: otherEventRoster!,
  };
}

test.group(
  "GET /orgs/:slug/events/:id/rosters/:rosterId/check-in-code",
  (group) => {
    group.each.setup(async () => {
      await db.delete(organizations);
      await db.delete(users);
    });

    test("an admin gets the dancer's pass code", async ({ client, assert }) => {
      const { admin, org, event, roster } = await fixture();
      const token = await login(client, admin.email);
      const res = await client
        .get(
          `/orgs/${org.slug}/events/${event.id}/rosters/${roster.id}/check-in-code`
        )
        .bearerToken(token);
      res.assertStatus(200);
      assert.deepEqual(verifyCheckInCode(res.body().checkInCode), {
        rosterId: roster.id,
        eventId: event.id,
      });
    });

    test("a non-admin member gets 403", async ({ client }) => {
      const { dancer, org, event, roster } = await fixture();
      const token = await login(client, dancer.email);
      const res = await client
        .get(
          `/orgs/${org.slug}/events/${event.id}/rosters/${roster.id}/check-in-code`
        )
        .bearerToken(token);
      res.assertStatus(403);
    });

    test("404 for a roster entry from another event and for a coach", async ({
      client,
    }) => {
      const { admin, org, event, coachRoster, otherEventRoster } =
        await fixture();
      const token = await login(client, admin.email);
      const base = `/orgs/${org.slug}/events/${event.id}/rosters`;

      const elsewhere = await client
        .get(`${base}/${otherEventRoster.id}/check-in-code`)
        .bearerToken(token);
      elsewhere.assertStatus(404);

      const coach = await client
        .get(`${base}/${coachRoster.id}/check-in-code`)
        .bearerToken(token);
      coach.assertStatus(404);
    });
  }
);
