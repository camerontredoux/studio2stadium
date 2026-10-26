import { db } from "#database/connection";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { createDancer, login } from "#tests/helpers/premium";
import drive from "@adonisjs/drive/services/main";
import { test } from "@japa/runner";

const KEY = "schedules/schedule-url-spec.pdf";

async function fixture(schedulePdfUrl: string | null = KEY) {
  const [member, outsider] = await Promise.all([
    createDancer(),
    createDancer(),
  ]);
  const [org] = await db
    .insert(organizations)
    .values({ name: "Schedule Org", slug: "schedule-org" })
    .returning();
  await db
    .insert(orgMemberships)
    .values({ orgId: org!.id, userId: member.id, type: "dancer" });
  const [event] = await db
    .insert(orgEvents)
    .values({
      orgId: org!.id,
      name: "Schedule Event",
      startDate: "2026-06-01",
      endDate: "2026-06-02",
      isActive: true,
      schedulePdfUrl,
    })
    .returning();
  await db.insert(eventRosters).values({
    eventId: event!.id,
    userId: member.id,
    type: "dancer",
    email: member.email,
    firstName: "Dana",
    lastName: "Dancer",
  });
  return { member, outsider, org: org!, event: event! };
}

test.group("GET /orgs/:slug/events/:id/schedule/url", (group) => {
  group.each.setup(async () => {
    await db.delete(organizations);
    await db.delete(users);
    const disk = drive.fake();
    await disk.put(KEY, "%PDF-1.7 schedule url spec");
    return () => drive.restore();
  });

  test("a member gets a signed URL for the file", async ({
    client,
    assert,
  }) => {
    const { member, org, event } = await fixture();
    const token = await login(client, member.email);
    const res = await client
      .get(`/orgs/${org.slug}/events/${event.id}/schedule/url`)
      .bearerToken(token);
    res.assertStatus(200);
    res.assertHeader("cache-control", "private, no-store");
    assert.include(res.body().url, "schedule-url-spec.pdf");
  });

  test("404 when the event has no schedule", async ({ client }) => {
    const { member, org, event } = await fixture(null);
    const token = await login(client, member.email);
    const res = await client
      .get(`/orgs/${org.slug}/events/${event.id}/schedule/url`)
      .bearerToken(token);
    res.assertStatus(404);
  });

  test("a user outside the org is refused", async ({ client }) => {
    const { outsider, org, event } = await fixture();
    const token = await login(client, outsider.email);
    const res = await client
      .get(`/orgs/${org.slug}/events/${event.id}/schedule/url`)
      .bearerToken(token);
    res.assertStatus(403);
  });
});
