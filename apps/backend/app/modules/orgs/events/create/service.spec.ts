import { test } from "@japa/runner";
import { db } from "#database/connection";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { orgEvents } from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { seedOrganizations } from "#commands/backfill-organizations";
import { CreateEventService } from "./service.ts";
import { DatabaseService } from "#database/service";
import { eq } from "drizzle-orm";

const svc = new CreateEventService(new DatabaseService());

async function createUser(attrs: Partial<typeof users.$inferInsert> & { username: string; email: string }) {
  const [u] = await db.insert(users).values({
    role: "user",
    type: "school",
    displayEmail: attrs.email,
    firstName: "Test",
    lastName: "User",
    password: "x",
    verified: true,
    ...attrs,
  }).returning();
  return u!;
}

test.group("CreateEventService", (group) => {
  group.each.setup(async () => {
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();
  });

  test("creates an event for an org", async ({ assert }) => {
    const [summit] = await db.select().from(organizations).where(eq(organizations.slug, "summit"));
    const ev = await svc.execute(summit!.id, {
      name: "Summit 2026",
      startDate: "2026-06-13",
      endDate: "2026-06-14",
      venueName: "Boston Garden",
      isActive: true,
    });
    assert.equal(ev.name, "Summit 2026");
    assert.isTrue(ev.isActive);
    assert.equal(ev.orgId, summit!.id);
  });

  test("throws E_UNIQUE_VIOLATION when a second active event is created", async ({ assert }) => {
    const [summit] = await db.select().from(organizations).where(eq(organizations.slug, "summit"));

    await svc.execute(summit!.id, {
      name: "First",
      startDate: "2026-06-13",
      endDate: "2026-06-14",
      isActive: true,
    });

    let caught: any;
    try {
      await svc.execute(summit!.id, {
        name: "Second",
        startDate: "2026-07-01",
        endDate: "2026-07-02",
        isActive: true,
      });
    } catch (err) {
      caught = err;
    }
    assert.exists(caught, "expected an error to be thrown");
    assert.equal(caught.code, "E_UNIQUE_VIOLATION");
  });

  test("inactive events do not trigger the unique constraint", async ({ assert }) => {
    const [summit] = await db.select().from(organizations).where(eq(organizations.slug, "summit"));

    const ev1 = await svc.execute(summit!.id, {
      name: "Inactive A",
      startDate: "2026-06-13",
      endDate: "2026-06-14",
      isActive: false,
    });
    const ev2 = await svc.execute(summit!.id, {
      name: "Inactive B",
      startDate: "2026-07-01",
      endDate: "2026-07-02",
      isActive: false,
    });
    assert.isFalse(ev1.isActive);
    assert.isFalse(ev2.isActive);
  });
});

test.group("POST /orgs/:slug/events middleware", (group) => {
  group.each.setup(async () => {
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();
  });

  test("401 for unauthenticated request", async ({ client }) => {
    const res = await client.post("/orgs/summit/events").json({
      name: "X", startDate: "2026-06-13", endDate: "2026-06-14",
    });
    res.assertStatus(401);
  });
});
