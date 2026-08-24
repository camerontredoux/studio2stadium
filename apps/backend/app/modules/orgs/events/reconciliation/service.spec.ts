import { test } from "@japa/runner";
import { eq, inArray } from "drizzle-orm";
import { db } from "#database/connection";
import { DatabaseService } from "#database/service";
import { organizations } from "#database/schema/organizations";
import { orgEvents, eventRosters } from "#database/schema/org-events";
import { schoolInvites } from "#database/schema/schools";
import { users } from "#database/schema/users";
import mail from "@adonisjs/mail/services/main";
import { ReconciliationService } from "./service.ts";

async function makeOrgAndEvent() {
  const [org] = await db
    .insert(organizations)
    .values({ name: "T", slug: `t-${Date.now()}-${Math.random()}` })
    .returning();
  const [event] = await db
    .insert(orgEvents)
    .values({
      orgId: org!.id,
      name: "E",
      startDate: "2026-06-01",
      endDate: "2026-06-02",
    })
    .returning();
  return { org: org!, event: event! };
}

test.group("ReconciliationService.resendInvite", (group) => {
  group.each.setup(async () => {
    await db.delete(eventRosters).execute();
    await db.delete(schoolInvites).execute();
    await db.delete(orgEvents).execute();
    await db.delete(organizations).execute();
    mail.fake();
  });

  group.each.teardown(() => {
    mail.restore();
  });

  test("does not resend or reopen an already-claimed invite", async ({
    assert,
  }) => {
    const { org, event } = await makeOrgAndEvent();
    // A previously emailed, already-claimed invite with a far-future expiry.
    const consumedAt = new Date();
    const farFuture = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60);
    const [invite] = await db
      .insert(schoolInvites)
      .values({
        eventId: event.id,
        email: "coach@example.com",
        organization: "Example University",
        token: "stable_admin_token",
        expiresAt: farFuture,
        consumedAt,
      })
      .returning();

    const service = new ReconciliationService(new DatabaseService());
    const result = await service.resendInvite(invite!.id, event.id, org.slug);
    // The coach has already registered — resend is a no-op (no email), and the
    // guard returns before the send/expiry-bump path.
    assert.deepEqual(result, { alreadyClaimed: true });

    const [after] = await db
      .select()
      .from(schoolInvites)
      .where(eq(schoolInvites.id, invite!.id));
    // Token, claim, and expiry all untouched.
    assert.equal(after!.token, "stable_admin_token");
    assert.isNotNull(after!.consumedAt);
    assert.equal(after!.expiresAt.getTime(), farFuture.getTime());
  });

  test("extends a short expiry without changing the token", async ({
    assert,
  }) => {
    const { org, event } = await makeOrgAndEvent();
    const soon = new Date(Date.now() + 1000);
    const [invite] = await db
      .insert(schoolInvites)
      .values({
        eventId: event.id,
        email: "coach2@example.com",
        organization: "Example University",
        token: "short_expiry_token",
        expiresAt: soon,
      })
      .returning();

    const service = new ReconciliationService(new DatabaseService());
    await service.resendInvite(invite!.id, event.id, org.slug);

    const [after] = await db
      .select()
      .from(schoolInvites)
      .where(eq(schoolInvites.id, invite!.id));
    assert.equal(after!.token, "short_expiry_token");
    // Expiry pushed out to ~14 days.
    assert.isAbove(after!.expiresAt.getTime(), Date.now() + 13 * 86400000);
    assert.isNull(after!.consumedAt);
  });
});

const SEARCH_EMAILS = [
  "recon-search-wilson@test.com",
  "recon-search-harman@test.com",
];

test.group("ReconciliationService.searchSchoolUsers", (group) => {
  group.each.setup(async () => {
    await db.delete(users).where(inArray(users.email, SEARCH_EMAILS)).execute();

    await db.insert(users).values([
      {
        username: "recon_search_wilson",
        email: SEARCH_EMAILS[0]!,
        displayEmail: SEARCH_EMAILS[0]!,
        firstName: "Jane",
        lastName: "Wilson",
        password: "x",
        role: "user" as const,
        type: "school" as const,
        verified: true,
      },
      {
        username: "recon_search_harman",
        email: SEARCH_EMAILS[1]!,
        displayEmail: SEARCH_EMAILS[1]!,
        firstName: "Jane",
        lastName: "Harman",
        password: "x",
        role: "user" as const,
        type: "school" as const,
        verified: true,
      },
    ]);

    return async () => {
      await db
        .delete(users)
        .where(inArray(users.email, SEARCH_EMAILS))
        .execute();
    };
  });

  test("matches a query spanning first and last name", async ({ assert }) => {
    const service = new ReconciliationService(new DatabaseService());
    const results = await service.searchSchoolUsers("Jane Wil");
    const emails = results.map((r) => r.email);

    assert.include(emails, SEARCH_EMAILS[0]);
    assert.notInclude(emails, SEARCH_EMAILS[1]);
  });

  test("still matches on a single name fragment and on email", async ({
    assert,
  }) => {
    const service = new ReconciliationService(new DatabaseService());

    const byName = await service.searchSchoolUsers("Jane");
    const nameEmails = byName.map((r) => r.email);
    assert.include(nameEmails, SEARCH_EMAILS[0]);
    assert.include(nameEmails, SEARCH_EMAILS[1]);

    const byEmail = await service.searchSchoolUsers("recon-search-harman@");
    const emailEmails = byEmail.map((r) => r.email);
    assert.include(emailEmails, SEARCH_EMAILS[1]);
  });

  test("ranks name prefixes above mid-string matches", async ({ assert }) => {
    const service = new ReconciliationService(new DatabaseService());
    const results = await service.searchSchoolUsers("Jane H");

    assert.equal(results[0]?.email, SEARCH_EMAILS[1]);
  });

  test("ignores surrounding whitespace and short queries", async ({
    assert,
  }) => {
    const service = new ReconciliationService(new DatabaseService());

    assert.isEmpty(await service.searchSchoolUsers(" J "));

    const results = await service.searchSchoolUsers("  Jane Wilson  ");
    const emails = results.map((r) => r.email);
    assert.include(emails, SEARCH_EMAILS[0]);
  });
});
