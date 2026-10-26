import { test } from "@japa/runner";
import { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import { eventAuditLog, orgEvents } from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { eq } from "drizzle-orm";
import { EventScheduleError } from "../event-schedule.ts";
import { UpdateEventService } from "./service.ts";

const svc = new UpdateEventService(new DatabaseService());

async function seed() {
  const ts = `${Date.now()}_${Math.random()}`;
  const [org] = await db
    .insert(organizations)
    .values({ name: `Org ${ts}`, slug: `org-${ts}`.replace(/\W/g, "-") })
    .returning();
  const [actor] = await db
    .insert(users)
    .values({
      username: `actor_${ts}`,
      email: `actor_${ts}@example.com`,
      displayEmail: `actor_${ts}@example.com`,
      firstName: "Actor",
      lastName: "User",
      password: "h",
      role: "admin",
      type: "dancer",
    })
    .returning();
  const [ev] = await db
    .insert(orgEvents)
    .values({
      orgId: org!.id,
      name: "Summit",
      startDate: "2026-10-22",
      endDate: "2026-10-24",
      startTime: "10:00",
      timezone: "America/Chicago",
    })
    .returning();
  return {
    org: org!,
    ev: ev!,
    ctx: { eventId: ev!.id, actorId: actor!.id },
  };
}

test.group("UpdateEventService schedule", (group) => {
  group.each.setup(async () => {
    await db.delete(eventAuditLog).execute();
    await db.delete(orgEvents).execute();
  });

  test("checks the stored event with the patch applied", async ({ assert }) => {
    const { org, ev, ctx } = await seed();

    // The patch alone is fine; with the stored 10:00 start it isn't.
    await assert.rejects(
      () => svc.execute(org.id, ev.id, { endTime: "09:00" }, ctx),
      EventScheduleError
    );

    const updated = await svc.execute(org.id, ev.id, { endTime: "16:00" }, ctx);
    assert.equal(updated!.endTime, "16:00");

    // Clearing the start time while an end time is stored is refused too.
    await assert.rejects(
      () =>
        svc.execute(org.id, ev.id, { startTime: null, timezone: null }, ctx),
      EventScheduleError
    );
    const [stored] = await db
      .select()
      .from(orgEvents)
      .where(eq(orgEvents.id, ev.id));
    assert.equal(stored!.startTime, "10:00");
  });
});
