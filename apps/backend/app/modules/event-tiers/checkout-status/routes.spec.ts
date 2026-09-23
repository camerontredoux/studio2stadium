import { db } from "#database/connection";
import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import {
  csvUploads,
  eventAuditLog,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { orgMemberships, organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import env from "#start/env";
import mail from "@adonisjs/mail/services/main";
import { test } from "@japa/runner";
import { toProvisionInput } from "../provisioning/checkout-session.ts";
import { ProvisionPurchaseService } from "../provisioning/service.ts";

const provision = new ProvisionPurchaseService(new DatabaseService());

async function wipe() {
  await db.delete(eventAuditLog).execute();
  await db.delete(csvUploads).execute();
  await db.delete(eventRosters).execute();
  await db.delete(eventTierPurchases).execute();
  await db.delete(orgEvents).execute();
  await db.delete(orgMemberships).execute();
  await db.delete(users).execute();
  await db.delete(organizations).execute();
}

async function makeBuyer() {
  const [buyer] = await db
    .insert(users)
    .values({
      username: "organizer_landing",
      email: "organizer_landing@example.com",
      displayEmail: "organizer_landing@example.com",
      firstName: "Ada",
      lastName: "Organizer",
      password: "h",
      role: "user",
      type: "dancer",
    })
    .returning();

  return buyer!;
}

test.group("GET /event-tiers/checkout/:sessionId", (group) => {
  group.each.setup(async () => {
    await wipe();
    // Provisioning emails the buyer their Org is ready.
    mail.fake();
  });

  // `event_tier_purchases.buyer_id` is ON DELETE RESTRICT; don't leave rows
  // behind for other suites' blanket `delete(users)`.
  group.each.teardown(async () => {
    mail.restore();
    await db.delete(eventTierPurchases).execute();
  });

  test("answers pending until the payment has been provisioned", async ({
    client,
    assert,
  }) => {
    const res = await client.get("/event-tiers/checkout/cs_test_notyet");

    res.assertStatus(200);
    assert.deepEqual(res.body(), { status: "pending" });
  });

  /** The same path the webhook takes: read the paid session, provision it. */
  async function landed(sessionId: string, email: string) {
    await provision.execute(
      await toProvisionInput({
        id: sessionId,
        payment_status: "paid",
        payment_intent: `pi_${sessionId}`,
        amount_total: 29900,
        currency: "usd",
        metadata: {
          name: "Ada Organizer",
          email,
          eventTier: "core",
          orgName: "Landing Dance Co",
          eventName: "Spring Showcase",
          startDate: "2026-04-01",
          endDate: "2026-04-02",
        },
      })
    );
  }

  test("once provisioned, a buyer the purchase created an account for is told to check their email", async ({
    client,
    assert,
  }) => {
    await landed("cs_test_landed", "brand_new_organizer@example.com");

    const res = await client.get("/event-tiers/checkout/cs_test_landed");

    res.assertStatus(200);
    assert.deepEqual(res.body(), {
      status: "provisioned",
      orgName: "Landing Dance Co",
      orgSlug: "landing-dance-co",
      orgUrl: `${env.get("SITE_URL")}/o/landing-dance-co/admin`,
      eventName: "Spring Showcase",
      nextStep: "set_password",
    });
  });

  test("once provisioned, a buyer who already had an account is told to sign in", async ({
    client,
    assert,
  }) => {
    const buyer = await makeBuyer();
    await landed("cs_test_existing", buyer.email);

    const res = await client.get("/event-tiers/checkout/cs_test_existing");

    res.assertStatus(200);
    assert.equal(res.body().nextStep, "sign_in");
    assert.equal(
      res.body().orgUrl,
      `${env.get("SITE_URL")}/o/landing-dance-co/admin`
    );
    // The buyer's address is never echoed back to whoever holds the session id.
    assert.notInclude(JSON.stringify(res.body()), buyer.email);
  });

  test("a second purchase before the buyer set their password is also told to check their email", async ({
    client,
    assert,
  }) => {
    await landed("cs_test_first", "twice_organizer@example.com");
    await landed("cs_test_second", "twice_organizer@example.com");

    const res = await client.get("/event-tiers/checkout/cs_test_second");

    res.assertStatus(200);
    assert.equal(res.body().nextStep, "set_password");
  });

  test("422s for something that is not a Checkout Session id", async ({
    client,
  }) => {
    const res = await client.get("/event-tiers/checkout/not-a-session");

    res.assertStatus(422);
  });
});
