import { db } from "#database/connection";
import { subscriptions } from "#database/schema/subscriptions";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import stripe from "#payments/stripe/main";
import { priceIdFor } from "#shared/plans";
import {
  configurePlanPrices,
  createDancer,
  DAY_MS,
  subscribe,
} from "#tests/helpers/premium";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
import type { Stripe } from "stripe";
import { PreviewPlanChangeService } from "./service.ts";

const seconds = (date: Date) => Math.floor(date.getTime() / 1000);

test.group("Preview plan change", (group) => {
  let previews: Stripe.InvoiceCreatePreviewParams[] = [];
  const renewsAt = new Date(Date.now() + 91 * DAY_MS);

  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    configurePlanPrices();
    previews = [];
  });

  /** Stripe with the member's Monthly subscription, set to cancel. */
  async function monthlySetToCancel(userId: string) {
    const [row] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    const { retrieve } = stripe.api.subscriptions;
    const { createPreview } = stripe.api.invoices;
    const prices = stripe.api.prices;
    const retrievePrice = prices.retrieve;

    stripe.api.subscriptions.retrieve = (async () => ({
      id: row!.subscriptionId,
      customer: row!.customerId,
      status: "active",
      cancel_at_period_end: true,
      cancel_at: null,
      schedule: null,
      trial_end: null,
      items: {
        data: [
          {
            id: "si_test",
            price: { id: priceIdFor("monthly") },
            current_period_end: seconds(new Date(Date.now() + 20 * DAY_MS)),
          },
        ],
      },
    })) as unknown as typeof retrieve;
    // Monthly to Season Pass ten days in: $69 for the new period, less the
    // unused $16.67 of the month.
    stripe.api.invoices.createPreview = (async (
      params: Stripe.InvoiceCreatePreviewParams
    ) => {
      previews.push(params);
      return {
        amount_due: 5233,
        total: 5233,
        currency: "usd",
        lines: {
          data: [
            {
              amount: -1667,
              period: { end: seconds(new Date()) },
              parent: { subscription_item_details: { proration: true } },
              pricing: { price_details: { price: priceIdFor("monthly") } },
            },
            {
              amount: 6900,
              discount_amounts: [],
              period: { end: seconds(renewsAt) },
              parent: { subscription_item_details: { proration: false } },
              pricing: {
                price_details: { price: priceIdFor("season_pass") },
              },
            },
          ],
        },
      };
    }) as unknown as typeof createPreview;
    prices.retrieve = (async () => ({
      unit_amount: 6900,
      currency: "usd",
      recurring: { interval: "month", interval_count: 3 },
    })) as unknown as typeof retrievePrice;

    return () => {
      stripe.api.subscriptions.retrieve = retrieve;
      stripe.api.invoices.createPreview = createPreview;
      prices.retrieve = retrievePrice;
    };
  }

  test("shows today's charge, the first renewal and the plan's terms, and that the cancellation ends", async ({
    assert,
    cleanup,
  }) => {
    const dancer = await createDancer();
    await subscribe(dancer.id);
    cleanup(await monthlySetToCancel(dancer.id));

    const preview = await new PreviewPlanChangeService(
      new DatabaseService()
    ).execute(dancer.id, "season_pass");

    assert.equal(preview.amountDue, 5233);
    assert.equal(preview.paidFromCredit, 0);
    assert.equal(preview.credit, 0);
    assert.equal(preview.renewsAt.getTime(), seconds(renewsAt) * 1000);
    assert.equal(preview.renewalAmount, 6900);
    assert.equal(
      preview.terms,
      "Renews automatically at $69.00 every 3 months until you cancel in Membership settings."
    );
    assert.isTrue(preview.clearsCancellation);

    // The preview prices the same switch the change makes.
    const details = previews[0]!.subscription_details!;
    assert.deepEqual(details.items, [
      { id: "si_test", price: priceIdFor("season_pass") },
    ]);
    assert.equal(details.proration_behavior, "always_invoice");
    assert.equal(details.proration_date, preview.prorationDate);
    assert.isFalse(details.cancel_at_period_end);
  });

  test("a member without a subscription is sent to the plans", async ({
    assert,
  }) => {
    const dancer = await createDancer();

    await assert.rejects(
      () =>
        new PreviewPlanChangeService(new DatabaseService()).execute(
          dancer.id,
          "annual"
        ),
      /You don't have a subscription to change/
    );
  });
});
