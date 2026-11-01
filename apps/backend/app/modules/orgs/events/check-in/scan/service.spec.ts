import { db } from "#database/connection";
import {
  eventAuditLog,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { createDancer } from "#tests/helpers/premium";
import { test } from "@japa/runner";
import { eq } from "drizzle-orm";
import { signCheckInCode } from "../check-in-code.ts";
import {
  E_CHECK_IN_CODE_INVALID,
  E_CHECK_IN_CODE_WRONG_EVENT,
  E_CHECK_IN_ROSTER_NOT_FOUND,
  ScanCheckInService,
} from "./service.ts";

async function fixture() {
  const actor = await createDancer();
  const [org, otherOrg] = await db
    .insert(organizations)
    .values([
      { name: "Scan Org", slug: "scan-org", features: { check_in: true } },
      { name: "Other Org", slug: "scan-other", features: { check_in: true } },
    ])
    .returning();
  const [event, otherEvent] = await db
    .insert(orgEvents)
    .values(
      [org!, otherOrg!].map((owner) => ({
        orgId: owner.id,
        name: "Scan Event",
        startDate: "2026-06-01",
        endDate: "2026-06-02",
        isActive: true,
      }))
    )
    .returning();
  const [roster, otherRoster] = await db
    .insert(eventRosters)
    .values([
      {
        eventId: event!.id,
        type: "dancer" as const,
        email: "scan-dancer@test.com",
        firstName: "Sam",
        lastName: "Scan",
        bibNumber: 101,
      },
      {
        eventId: otherEvent!.id,
        type: "dancer" as const,
        email: "other-dancer@test.com",
        firstName: "Olly",
        lastName: "Other",
        bibNumber: 7,
      },
    ])
    .returning();
  return {
    actorId: actor.id,
    org: org!,
    otherOrg: otherOrg!,
    event: event!,
    otherEvent: otherEvent!,
    roster: roster!,
    otherRoster: otherRoster!,
  };
}

async function auditCount(eventId: string) {
  const rows = await db
    .select()
    .from(eventAuditLog)
    .where(eq(eventAuditLog.eventId, eventId));
  return rows.length;
}

test.group("ScanCheckInService", (group) => {
  group.each.setup(async () => {
    await db.delete(eventAuditLog);
    await db.delete(organizations);
    await db.delete(users);
  });

  test("a valid code checks the dancer in and writes one audit entry", async ({
    assert,
  }) => {
    const { actorId, org, event, roster } = await fixture();
    const result = await new ScanCheckInService().execute({
      orgId: org.id,
      eventId: event.id,
      code: signCheckInCode(roster.id, event.id),
      actorId,
    });

    assert.equal(result.result, "checked_in");
    assert.equal(result.roster.id, roster.id);
    assert.equal(result.roster.bib, 101);
    assert.equal(result.roster.firstName, "Sam");
    assert.isString(result.roster.checkedInAt);
    assert.equal(await auditCount(event.id), 1);
  });

  test("a second scan reports already_checked_in and writes no audit entry", async ({
    assert,
  }) => {
    const { actorId, org, event, roster } = await fixture();
    const svc = new ScanCheckInService();
    const input = {
      orgId: org.id,
      eventId: event.id,
      code: signCheckInCode(roster.id, event.id),
      actorId,
    };
    const first = await svc.execute(input);
    const second = await svc.execute(input);

    assert.equal(second.result, "already_checked_in");
    assert.equal(second.roster.checkedInAt, first.roster.checkedInAt);
    assert.equal(await auditCount(event.id), 1);
  });

  test("a tampered code is rejected", async ({ assert }) => {
    const { actorId, org, event, roster } = await fixture();
    const code = signCheckInCode(roster.id, event.id);
    const last = code.at(-1) === "A" ? "B" : "A";

    await assert.rejects(
      () =>
        new ScanCheckInService().execute({
          orgId: org.id,
          eventId: event.id,
          code: code.slice(0, -1) + last,
          actorId,
        }),
      E_CHECK_IN_CODE_INVALID
    );
    await assert.rejects(
      () =>
        new ScanCheckInService().execute({
          orgId: org.id,
          eventId: event.id,
          code: "101",
          actorId,
        }),
      E_CHECK_IN_CODE_INVALID
    );
  });

  test("a code from another event is rejected and changes nothing", async ({
    assert,
  }) => {
    const { actorId, org, event, otherEvent, otherRoster } = await fixture();

    await assert.rejects(
      () =>
        new ScanCheckInService().execute({
          orgId: org.id,
          eventId: event.id,
          code: signCheckInCode(otherRoster.id, otherEvent.id),
          actorId,
        }),
      E_CHECK_IN_CODE_WRONG_EVENT
    );
    const [row] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.id, otherRoster.id));
    assert.isNull(row!.checkedInAt);
  });

  test("an event of another org is not found", async ({ assert }) => {
    const { actorId, org, otherEvent, otherRoster } = await fixture();

    await assert.rejects(
      () =>
        new ScanCheckInService().execute({
          orgId: org.id,
          eventId: otherEvent.id,
          code: signCheckInCode(otherRoster.id, otherEvent.id),
          actorId,
        }),
      "Event not found."
    );
  });

  test("a removed roster entry is not found", async ({ assert }) => {
    const { actorId, org, event, roster } = await fixture();
    const code = signCheckInCode(roster.id, event.id);
    await db.delete(eventRosters).where(eq(eventRosters.id, roster.id));

    await assert.rejects(
      () =>
        new ScanCheckInService().execute({
          orgId: org.id,
          eventId: event.id,
          code,
          actorId,
        }),
      E_CHECK_IN_ROSTER_NOT_FOUND
    );
  });
});
