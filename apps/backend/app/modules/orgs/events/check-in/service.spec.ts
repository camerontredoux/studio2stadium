import { test } from "@japa/runner";
import { db } from "#database/connection";
import { orgEvents, eventRosters } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { eq } from "drizzle-orm";
import { CheckInService, CheckInNotOpenError, NotOnRosterError } from "./service.ts";

test.group("CheckInService", (group) => {
  let orgId: string;
  let eventId: string;
  let dancerUserId: string;

  group.each.setup(async () => {
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(users).execute();

    const [org] = await db
      .select()
      .from(organizations)
      .limit(1);
    orgId = org.id;

    const ts = Date.now();
    const [dancer] = await db
      .insert(users)
      .values({
        username: `test-dancer-${ts}`,
        email: `dancer-${ts}@test.com`,
        displayEmail: `dancer-${ts}@test.com`,
        firstName: "Test",
        lastName: "Dancer",
        password: "hashed",
        role: "user",
        type: "dancer",
        verified: true,
      })
      .returning();
    dancerUserId = dancer!.id;

    const [ev] = await db
      .insert(orgEvents)
      .values({
        orgId,
        name: "Test Event",
        startDate: "2020-01-01",
        endDate: "2020-01-03",
        startTime: "09:00",
        timezone: "America/New_York",
        isActive: true,
      })
      .returning();
    eventId = ev.id;

    await db
      .insert(eventRosters)
      .values({
        eventId,
        userId: dancerUserId,
        type: "dancer",
        email: "dancer@test.com",
        firstName: "Test",
        lastName: "Dancer",
      });
  });

  test("checks in a dancer when event has started", async ({ assert }) => {
    const svc = new CheckInService();
    const result = await svc.execute(eventId, dancerUserId);
    assert.isNotNull(result.checkedInAt);
  });

  test("is idempotent — second call returns same timestamp", async ({ assert }) => {
    const svc = new CheckInService();
    const first = await svc.execute(eventId, dancerUserId);
    const second = await svc.execute(eventId, dancerUserId);
    assert.equal(
      first.checkedInAt?.toISOString(),
      second.checkedInAt?.toISOString(),
    );
  });

  test("throws CheckInNotOpenError when event has no startTime", async ({ assert }) => {
    await db
      .update(orgEvents)
      .set({ startTime: null, timezone: null })
      .where(eq(orgEvents.id, eventId));

    const svc = new CheckInService();
    await assert.rejects(
      () => svc.execute(eventId, dancerUserId),
      CheckInNotOpenError.prototype.message,
    );
  });

  test("throws CheckInNotOpenError when event has not started", async ({ assert }) => {
    await db
      .update(orgEvents)
      .set({ startDate: "2099-12-31", startTime: "23:59", timezone: "America/New_York" })
      .where(eq(orgEvents.id, eventId));

    const svc = new CheckInService();
    await assert.rejects(
      () => svc.execute(eventId, dancerUserId),
      CheckInNotOpenError.prototype.message,
    );
  });

  test("throws NotOnRosterError when user is not a dancer on this event", async ({ assert }) => {
    const ts2 = Date.now();
    const [other] = await db
      .insert(users)
      .values({
        username: `other-${ts2}`,
        email: `other-${ts2}@test.com`,
        displayEmail: `other-${ts2}@test.com`,
        firstName: "Other",
        lastName: "User",
        password: "hashed",
        role: "user",
        type: "dancer",
        verified: true,
      })
      .returning();

    const svc = new CheckInService();
    await assert.rejects(
      () => svc.execute(eventId, other.id),
      NotOnRosterError.prototype.message,
    );
  });
});
