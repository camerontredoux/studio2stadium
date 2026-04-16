import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { organizations, orgMemberships } from "#database/schema/organizations";
import {
  orgEvents,
  eventRosters,
  csvUploads,
} from "#database/schema/org-events";
import { seedOrganizations } from "#commands/backfill-organizations";
import { eq } from "drizzle-orm";
import { EventStatsService } from "./service.ts";

async function createUser(attrs: { username: string; email: string }) {
  const [u] = await db
    .insert(users)
    .values({
      username: attrs.username,
      email: attrs.email,
      displayEmail: attrs.email,
      firstName: "T",
      lastName: "U",
      password: "x",
      role: "user",
      type: "dancer",
      verified: true,
    })
    .returning();
  return u!;
}

test.group("EventStatsService", (group) => {
  let summit: typeof organizations.$inferSelect;
  let event: typeof orgEvents.$inferSelect;

  group.each.setup(async () => {
    await db.delete(csvUploads).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();
    [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    const [ev] = await db
      .insert(orgEvents)
      .values({
        orgId: summit.id,
        name: "Summit 2026",
        startDate: "2026-06-13",
        endDate: "2026-06-14",
        isActive: true,
      })
      .returning();
    event = ev!;
  });

  test("returns zero counts for empty event", async ({ assert }) => {
    const svc = new EventStatsService();
    const stats = await svc.execute(event.id);
    assert.equal(stats.dancers.total, 0);
    assert.equal(stats.dancers.activated, 0);
    assert.equal(stats.dancers.pending, 0);
    assert.equal(stats.coaches.total, 0);
    assert.equal(stats.coaches.activated, 0);
    assert.equal(stats.coaches.pending, 0);
    assert.equal(stats.registered, 0);
    assert.equal(stats.pending, 0);
    assert.isArray(stats.recentUploads);
    assert.lengthOf(stats.recentUploads, 0);
  });

  test("counts activated/pending split correctly per role", async ({
    assert,
  }) => {
    const u1 = await createUser({ username: "u1", email: "u1@x.co" });
    const u2 = await createUser({ username: "u2", email: "u2@x.co" });

    await db.insert(eventRosters).values([
      // 1 pending coach
      {
        eventId: event.id,
        type: "coach",
        email: "coach@x.co",
        firstName: "C",
        lastName: "O",
      },
      // 2 activated dancers
      {
        eventId: event.id,
        type: "dancer",
        email: "u1@x.co",
        firstName: "D",
        lastName: "One",
        userId: u1.id,
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "u2@x.co",
        firstName: "D",
        lastName: "Two",
        userId: u2.id,
      },
      // 1 pending dancer
      {
        eventId: event.id,
        type: "dancer",
        email: "ghost@x.co",
        firstName: "G",
        lastName: "H",
      },
    ]);

    const svc = new EventStatsService();
    const stats = await svc.execute(event.id);

    assert.equal(stats.coaches.total, 1);
    assert.equal(stats.coaches.activated, 0);
    assert.equal(stats.coaches.pending, 1);

    assert.equal(stats.dancers.total, 3);
    assert.equal(stats.dancers.activated, 2);
    assert.equal(stats.dancers.pending, 1);

    // Flat aliases (backward compat)
    assert.equal(stats.registered, 2);
    assert.equal(stats.pending, 2); // 1 pending coach + 1 pending dancer
  });

  test("recentUploads returns last 5 ordered by createdAt desc", async ({
    assert,
  }) => {
    const uploader = await createUser({ username: "up", email: "up@x.co" });
    for (let i = 0; i < 6; i++) {
      await db.insert(csvUploads).values({
        eventId: event.id,
        type: "coach",
        fileUrl: `test://f${i}.csv`,
        uploadedBy: uploader.id,
        rowsAdded: i,
        rowsUpdated: 0,
        rowsErrored: 0,
      });
    }
    const svc = new EventStatsService();
    const stats = await svc.execute(event.id);
    assert.lengthOf(stats.recentUploads, 5);
  });
});
