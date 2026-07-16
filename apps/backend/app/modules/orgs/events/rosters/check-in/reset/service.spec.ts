import { test } from "@japa/runner";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "#database/connection";
import {
  eventAuditLog,
  orgEvents,
  eventRosters,
} from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { ResetCheckInService } from "./service.ts";

test.group("ResetCheckInService", (group) => {
  let orgId: string;
  let eventId: string;
  let otherEventId: string;
  let actorId: string;

  const addRoster = async (
    targetEventId: string,
    values: { email: string; checkedIn: boolean; isStaff?: boolean }
  ) => {
    const [row] = await db
      .insert(eventRosters)
      .values({
        eventId: targetEventId,
        type: values.isStaff ? "coach" : "dancer",
        email: values.email,
        firstName: "Test",
        lastName: "Dancer",
        isStaff: values.isStaff ?? false,
        checkedInAt: values.checkedIn ? new Date() : null,
      })
      .returning();
    return row;
  };

  group.each.setup(async () => {
    await db.delete(eventAuditLog).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();

    const [org] = await db.select().from(organizations).limit(1);
    orgId = org.id;

    const [actor] = await db.select().from(users).limit(1);
    actorId = actor.id;

    const [ev] = await db
      .insert(orgEvents)
      .values({
        orgId,
        name: "Test Event",
        startDate: "2020-01-01",
        endDate: "2020-01-03",
        isActive: true,
      })
      .returning();
    eventId = ev.id;

    const [other] = await db
      .insert(orgEvents)
      .values({
        orgId,
        name: "Other Event",
        startDate: "2020-02-01",
        endDate: "2020-02-03",
        isActive: false,
      })
      .returning();
    otherEventId = other.id;
  });

  test("clears checkedInAt and returns the reset count", async ({ assert }) => {
    await addRoster(eventId, { email: "a@test.com", checkedIn: true });
    await addRoster(eventId, { email: "b@test.com", checkedIn: true });
    await addRoster(eventId, { email: "c@test.com", checkedIn: false });

    const svc = new ResetCheckInService();
    const result = await svc.execute(eventId, { eventId, actorId });

    assert.equal(result.reset, 2);

    const stillCheckedIn = await db
      .select()
      .from(eventRosters)
      .where(
        and(
          eq(eventRosters.eventId, eventId),
          isNotNull(eventRosters.checkedInAt)
        )
      );
    assert.lengthOf(stillCheckedIn, 0);
  });

  test("logs one audit entry per reset row", async ({ assert }) => {
    await addRoster(eventId, { email: "a@test.com", checkedIn: true });
    await addRoster(eventId, { email: "b@test.com", checkedIn: true });
    await addRoster(eventId, { email: "c@test.com", checkedIn: false });

    const svc = new ResetCheckInService();
    await svc.execute(eventId, { eventId, actorId });

    const entries = await db
      .select()
      .from(eventAuditLog)
      .where(eq(eventAuditLog.eventId, eventId));

    // Only the two checked-in rows should produce entries.
    assert.lengthOf(entries, 2);
    for (const entry of entries) {
      assert.equal(entry.action, "update");
      assert.equal(entry.resource, "roster");
      assert.equal(
        (entry.metadata as { field?: string } | null)?.field,
        "checkedInAt"
      );
      assert.isNull((entry.metadata as { after?: unknown } | null)?.after);
    }
  });

  test("does not touch rosters belonging to a different event", async ({
    assert,
  }) => {
    await addRoster(eventId, { email: "a@test.com", checkedIn: true });
    const untouched = await addRoster(otherEventId, {
      email: "other@test.com",
      checkedIn: true,
    });

    const svc = new ResetCheckInService();
    const result = await svc.execute(eventId, { eventId, actorId });

    assert.equal(result.reset, 1);

    const [after] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.id, untouched.id));
    assert.isNotNull(after.checkedInAt);
  });

  test("resets staff rows too", async ({ assert }) => {
    const staff = await addRoster(eventId, {
      email: "staff@test.com",
      checkedIn: true,
      isStaff: true,
    });

    const svc = new ResetCheckInService();
    const result = await svc.execute(eventId, { eventId, actorId });

    assert.equal(result.reset, 1);

    const [after] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.id, staff.id));
    assert.isNull(after.checkedInAt);
  });

  test("returns { reset: 0 } and logs nothing when no one is checked in", async ({
    assert,
  }) => {
    await addRoster(eventId, { email: "a@test.com", checkedIn: false });

    const svc = new ResetCheckInService();
    const result = await svc.execute(eventId, { eventId, actorId });

    assert.equal(result.reset, 0);

    const entries = await db
      .select()
      .from(eventAuditLog)
      .where(eq(eventAuditLog.eventId, eventId));
    assert.lengthOf(entries, 0);
  });
});
