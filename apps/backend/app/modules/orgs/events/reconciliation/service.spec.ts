import { test } from "@japa/runner";
import { eq } from "drizzle-orm";
import { db } from "#database/connection";
import { DatabaseService } from "#database/service";
import { organizations } from "#database/schema/organizations";
import { orgEvents, eventRosters } from "#database/schema/org-events";
import { schoolInvites } from "#database/schema/schools";
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

  test("keeps the same token and preserves consumedAt on resend", async ({
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
    assert.deepEqual(result, { resent: true });

    const [after] = await db
      .select()
      .from(schoolInvites)
      .where(eq(schoolInvites.id, invite!.id));
    // Token reused, not regenerated.
    assert.equal(after!.token, "stable_admin_token");
    // Claim preserved (never reopened).
    assert.isNotNull(after!.consumedAt);
    // Expiry not shortened below the far-future value.
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
