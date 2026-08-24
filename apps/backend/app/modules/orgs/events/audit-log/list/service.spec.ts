import { test } from "@japa/runner";
import { db } from "#database/connection";
import {
  csvUploadRows,
  csvUploads,
  eventAuditLog,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { ListAuditLogService } from "./service.ts";

const ORIGINAL_EMAIL = "uploaded-under@test.com";
const CURRENT_EMAIL = "claimed-as@test.com";

test.group("ListAuditLogService", (group) => {
  let eventId: string;
  let rosterId: string;
  let actorId: string;

  group.each.setup(async () => {
    await db.delete(eventAuditLog).execute();
    await db.delete(csvUploads).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();

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

    // The roster entry as it looks *after* an account was attached: the email
    // and name were rewritten in place, so the address it was uploaded under
    // survives only in the audit metadata.
    const [roster] = await db
      .insert(eventRosters)
      .values({
        eventId,
        type: "dancer",
        email: CURRENT_EMAIL,
        firstName: "Claimed",
        lastName: "Dancer",
        bibNumber: 337,
      })
      .returning();
    rosterId = roster.id;

    await db.insert(eventAuditLog).values({
      eventId,
      actorId,
      action: "activate",
      resource: "roster",
      resourceId: rosterId,
      metadata: {
        type: "attach_to_account",
        relinked: true,
        before: { email: ORIGINAL_EMAIL, firstName: "Csv", lastName: "Row" },
        after: { email: CURRENT_EMAIL, firstName: "Claimed", lastName: "Dancer" },
        previousEmail: ORIGINAL_EMAIL,
        newEmail: CURRENT_EMAIL,
      },
    });
  });

  test("finds entries by the dancer's current email", async ({ assert }) => {
    const svc = new ListAuditLogService();
    const res = await svc.execute(eventId, { search: CURRENT_EMAIL });

    assert.equal(res.total, 1);
    assert.lengthOf(res.data, 1);
  });

  test("finds entries by an email the roster no longer carries", async ({
    assert,
  }) => {
    const svc = new ListAuditLogService();
    const res = await svc.execute(eventId, { search: ORIGINAL_EMAIL });

    // Without the metadata search this returns nothing, which is the case
    // where the history matters most.
    assert.equal(res.total, 1);
    assert.lengthOf(res.data, 1);
    assert.equal(res.data[0]!.resourceId, rosterId);
  });

  test("resolves the dancer a roster entry is about", async ({ assert }) => {
    const svc = new ListAuditLogService();
    const res = await svc.execute(eventId, {});

    assert.equal(res.data[0]!.subject?.rosterId, rosterId);
    assert.equal(res.data[0]!.subject?.email, CURRENT_EMAIL);
    assert.equal(res.data[0]!.subject?.bibNumber, 337);
  });

  test("still matches the acting admin", async ({ assert }) => {
    const [actor] = await db.select().from(users).limit(1);
    const svc = new ListAuditLogService();
    const res = await svc.execute(eventId, { search: actor.email });

    assert.isAbove(res.total, 0);
  });

  test("returns nothing for an unrelated address", async ({ assert }) => {
    const svc = new ListAuditLogService();
    const res = await svc.execute(eventId, { search: "nobody@example.com" });

    assert.equal(res.total, 0);
  });

  test("finds the CSV upload that introduced a dancer", async ({ assert }) => {
    const [actor] = await db.select().from(users).limit(1);
    const [upload] = await db
      .insert(csvUploads)
      .values({
        eventId,
        type: "dancer",
        fileUrl: "test://dancers.csv",
        uploadedBy: actor.id,
        rowsAdded: 1,
      })
      .returning();

    await db.insert(csvUploadRows).values({
      csvUploadId: upload!.id,
      rowNumber: 1,
      email: ORIGINAL_EMAIL,
      firstName: "Csv",
      lastName: "Row",
      outcome: "added",
      rosterId,
    });

    await db.insert(eventAuditLog).values({
      eventId,
      actorId,
      action: "upload",
      resource: "csv_upload",
      resourceId: upload!.id,
      metadata: { type: "dancer", rowsAdded: 1 },
    });

    const svc = new ListAuditLogService();
    const res = await svc.execute(eventId, { search: ORIGINAL_EMAIL });

    // Both the upload that introduced her and the reassignment should surface.
    const resources = res.data.map((r) => r.resource);
    assert.include(resources, "csv_upload");
    assert.include(resources, "roster");
  });

  test("leaves subject null for non-roster entries", async ({ assert }) => {
    await db.delete(eventAuditLog).execute();
    await db.insert(eventAuditLog).values({
      eventId,
      actorId,
      action: "update",
      resource: "event",
      resourceId: eventId,
      metadata: { before: {}, after: {} },
    });

    const svc = new ListAuditLogService();
    const res = await svc.execute(eventId, {});

    assert.lengthOf(res.data, 1);
    assert.isNull(res.data[0]!.subject);
  });
});
