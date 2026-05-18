import { test } from "@japa/runner";
import { db } from "#database/connection";
import { eventAuditLog, orgEvents, eventRosters } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { AdminCheckInService } from "./service.ts";

test.group("AdminCheckInService", (group) => {
  let orgId: string;
  let eventId: string;
  let rosterId: string;
  let actorId: string;

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

    const [roster] = await db
      .insert(eventRosters)
      .values({
        eventId,
        type: "dancer",
        email: "dancer@test.com",
        firstName: "Test",
        lastName: "Dancer",
      })
      .returning();
    rosterId = roster.id;
  });

  test("toggles null → now() (checks in)", async ({ assert }) => {
    const svc = new AdminCheckInService();
    const result = await svc.execute(eventId, rosterId, actorId);
    assert.isNotNull(result.checkedInAt);
  });

  test("toggles non-null → null (undoes check-in)", async ({ assert }) => {
    const svc = new AdminCheckInService();
    await svc.execute(eventId, rosterId, actorId);
    const result = await svc.execute(eventId, rosterId, actorId);
    assert.isNull(result.checkedInAt);
  });

  test("works without time gate (no startTime on event)", async ({ assert }) => {
    const svc = new AdminCheckInService();
    const result = await svc.execute(eventId, rosterId, actorId);
    assert.isNotNull(result.checkedInAt);
  });
});
