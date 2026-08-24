import { test } from "@japa/runner";
import { db } from "#database/connection";
import {
  eventAuditLog,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { eq, inArray } from "drizzle-orm";
import { AttachAccountService, RosterAlreadyLinkedError } from "./service.ts";

const HOLDER_EMAIL = "attach-holder@test.com";
const CLAIMANT_EMAIL = "attach-claimant@test.com";

test.group("AttachAccountService", (group) => {
  let eventId: string;
  let rosterId: string;
  let actorId: string;
  let holderId: string;
  let claimantId: string;

  group.each.setup(async () => {
    await db.delete(eventAuditLog).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db
      .delete(users)
      .where(inArray(users.email, [HOLDER_EMAIL, CLAIMANT_EMAIL]))
      .execute();

    const [org] = await db.select().from(organizations).limit(1);
    const [actor] = await db.select().from(users).limit(1);
    actorId = actor.id;

    const [ev] = await db
      .insert(orgEvents)
      .values({
        orgId: org.id,
        name: "Test Event",
        startDate: "2020-01-01",
        endDate: "2020-01-03",
        isActive: true,
      })
      .returning();
    eventId = ev.id;

    const inserted = await db
      .insert(users)
      .values([
        {
          username: "attach_holder",
          email: HOLDER_EMAIL,
          displayEmail: HOLDER_EMAIL,
          firstName: "Holder",
          lastName: "Original",
          password: "x",
          role: "user" as const,
          type: "dancer" as const,
          verified: true,
        },
        {
          username: "attach_claimant",
          email: CLAIMANT_EMAIL,
          displayEmail: CLAIMANT_EMAIL,
          firstName: "Claimant",
          lastName: "New",
          password: "x",
          role: "user" as const,
          type: "dancer" as const,
          verified: true,
        },
      ])
      .returning();
    holderId = inserted.find((u) => u.email === HOLDER_EMAIL)!.id;
    claimantId = inserted.find((u) => u.email === CLAIMANT_EMAIL)!.id;

    const [roster] = await db
      .insert(eventRosters)
      .values({
        eventId,
        type: "dancer",
        email: "csv-row@test.com",
        firstName: "Csv",
        lastName: "Row",
      })
      .returning();
    rosterId = roster.id;
  });

  test("attaches an unclaimed entry without confirmation", async ({
    assert,
  }) => {
    const svc = new AttachAccountService();
    const result = await svc.attach(eventId, rosterId, claimantId, actorId);

    assert.isTrue(result!.isRegistered);
    assert.equal(result!.email, CLAIMANT_EMAIL);
  });

  test("refuses to reassign an entry held by another account", async ({
    assert,
  }) => {
    const svc = new AttachAccountService();
    await svc.attach(eventId, rosterId, holderId, actorId);

    await assert.rejects(
      () => svc.attach(eventId, rosterId, claimantId, actorId),
      RosterAlreadyLinkedError.prototype.message
    );

    // The holder must still own the entry — a refused reassignment cannot
    // leave the row half-rewritten.
    const [row] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.id, rosterId));
    assert.equal(row.userId, holderId);
    assert.equal(row.email, HOLDER_EMAIL);
  });

  test("names the displaced account on the error", async ({ assert }) => {
    const svc = new AttachAccountService();
    await svc.attach(eventId, rosterId, holderId, actorId);

    try {
      await svc.attach(eventId, rosterId, claimantId, actorId);
      assert.fail("expected the reassignment to be refused");
    } catch (err) {
      assert.instanceOf(err, RosterAlreadyLinkedError);
      assert.equal((err as RosterAlreadyLinkedError).currentUser.id, holderId);
      assert.equal(
        (err as RosterAlreadyLinkedError).currentUser.email,
        HOLDER_EMAIL
      );
    }
  });

  test("reassigns once confirmed", async ({ assert }) => {
    const svc = new AttachAccountService();
    await svc.attach(eventId, rosterId, holderId, actorId);

    const result = await svc.attach(
      eventId,
      rosterId,
      claimantId,
      actorId,
      true
    );

    assert.equal(result!.email, CLAIMANT_EMAIL);
    const [row] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.id, rosterId));
    assert.equal(row.userId, claimantId);
  });

  test("re-attaching the current holder needs no confirmation", async ({
    assert,
  }) => {
    const svc = new AttachAccountService();
    await svc.attach(eventId, rosterId, holderId, actorId);

    const result = await svc.attach(eventId, rosterId, holderId, actorId);
    assert.equal(result!.email, HOLDER_EMAIL);
  });

  test("records the displaced account in the audit entry", async ({
    assert,
  }) => {
    const svc = new AttachAccountService();
    await svc.attach(eventId, rosterId, holderId, actorId);
    await svc.attach(eventId, rosterId, claimantId, actorId, true);

    const entries = await db
      .select()
      .from(eventAuditLog)
      .where(eq(eventAuditLog.resourceId, rosterId));

    const relink = entries.find(
      (e) => (e.metadata as Record<string, unknown>)?.relinked === true
    );
    assert.exists(relink, "expected the reassignment to be audited");

    const meta = relink!.metadata as Record<string, any>;
    // The original identity has to survive the overwrite — losing it is what
    // made a real reassignment impossible to reconstruct after the fact.
    assert.equal(meta.before.userId, holderId);
    assert.equal(meta.before.email, HOLDER_EMAIL);
    assert.equal(meta.before.firstName, "Holder");
    assert.equal(meta.before.lastName, "Original");
    assert.equal(meta.after.userId, claimantId);
    assert.isTrue(meta.confirmed);
  });
});
