import { test } from "@japa/runner";
import { eq } from "drizzle-orm";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { orgMemberships, organizations } from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { schoolInvites, schoolProfiles } from "#database/schema/schools";
import { seedOrganizations } from "#commands/backfill-organizations";
import { randomBytes } from "node:crypto";

function token() {
  return randomBytes(32).toString("hex");
}

async function createEvent(name: string) {
  const [summit] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "summit"));
  const [event] = await db
    .insert(orgEvents)
    .values({
      orgId: summit!.id,
      name,
      startDate: "2026-06-01",
      endDate: "2026-06-02",
    })
    .returning();
  return { summit: summit!, event: event! };
}

test.group("School invite lookup", (group) => {
  group.each.setup(async () => {
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(schoolInvites).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(schoolProfiles).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();
  });

  test("valid token returns valid status with prefill fields", async ({
    client,
    assert,
  }) => {
    const { event } = await createEvent("Lookup Valid Event");
    const tok = token();
    await db.insert(schoolInvites).values({
      eventId: event.id,
      email: "valid@example.com",
      organization: "Valid Academy",
      token: tok,
      expiresAt: new Date(Date.now() + 86400000),
    });

    const res = await client.get(`/orgs/invites/school/${tok}`);
    res.assertStatus(200);
    res.assertBodyContains({
      status: "valid",
      email: "valid@example.com",
      organization: "Valid Academy",
      eventName: "Lookup Valid Event",
    });
    assert.equal(res.body().eventId, event.id);
    assert.isString(res.body().orgName);
    assert.isString(res.body().orgSlug);
    assert.isNotNull(res.body().expiresAt);
  });

  test("consumed token returns consumed status with null fields", async ({
    client,
    assert,
  }) => {
    const { event } = await createEvent("Lookup Consumed Event");
    const tok = token();
    await db.insert(schoolInvites).values({
      eventId: event.id,
      email: "consumed@example.com",
      token: tok,
      expiresAt: new Date(Date.now() + 86400000),
      consumedAt: new Date(),
    });

    const res = await client.get(`/orgs/invites/school/${tok}`);
    res.assertStatus(200);
    res.assertBodyContains({ status: "consumed" });
    assert.isNull(res.body().email);
    assert.isNull(res.body().eventId);
  });

  test("expired token returns expired status with null fields", async ({
    client,
    assert,
  }) => {
    const { event } = await createEvent("Lookup Expired Event");
    const tok = token();
    await db.insert(schoolInvites).values({
      eventId: event.id,
      email: "expired@example.com",
      token: tok,
      expiresAt: new Date(Date.now() - 86400000),
    });

    const res = await client.get(`/orgs/invites/school/${tok}`);
    res.assertStatus(200);
    res.assertBodyContains({ status: "expired" });
    assert.isNull(res.body().email);
  });

  test("unknown token returns invalid status", async ({ client }) => {
    const res = await client.get(`/orgs/invites/school/${token()}`);
    res.assertStatus(200);
    res.assertBodyContains({ status: "invalid" });
  });

  test("too-short token returns invalid status without hitting db", async ({
    client,
  }) => {
    const res = await client.get("/orgs/invites/school/short");
    res.assertStatus(200);
    res.assertBodyContains({ status: "invalid" });
  });
});
