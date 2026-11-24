import { db } from "#database/connection";
import { subscriptions } from "#database/schema/subscriptions";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import { PromotionRedemptionService } from "#modules/subscriptions/record-promotion-redemption/service";
import stripe from "#payments/stripe/main";
import { priceIdFor } from "#shared/plans";
import {
  buyWeekPass,
  configurePlanPrices,
  createDancer,
  DAY_MS,
  subscribe,
} from "#tests/helpers/premium";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
import type { Stripe } from "stripe";
import { Service } from "./service.ts";

const PRICES: Record<string, Partial<Stripe.Price>> = {
  price_test_season_pass: {
    unit_amount: 6900,
    currency: "usd",
    recurring: {
      interval: "month",
      interval_count: 3,
    } as Stripe.Price.Recurring,
  },
  price_test_week_pass: { unit_amount: 1299, currency: "usd", recurring: null },
};

/** The line Stripe Checkout shows above its pay button. */
const disclosure = (session: Stripe.Checkout.SessionCreateParams | undefined) =>
  (session?.custom_text?.submit || undefined)?.message;

test.group("Create checkout", (group) => {
  let sessions: Stripe.Checkout.SessionCreateParams[] = [];

  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    configurePlanPrices();
    sessions = [];
    const { create } = stripe.api.checkout.sessions;
    const { retrieve } = stripe.api.prices;
    stripe.api.checkout.sessions.create = (async (
      params: Stripe.Checkout.SessionCreateParams
    ) => {
      sessions.push(params);
      return { client_secret: "cs_secret" };
    }) as unknown as typeof create;
    stripe.api.prices.retrieve = (async (id: string) =>
      PRICES[id] ?? {
        unit_amount: 2500,
        currency: "usd",
        recurring: { interval: "month", interval_count: 1 },
      }) as unknown as typeof retrieve;
    return () => {
      stripe.api.checkout.sessions.create = create;
      stripe.api.prices.retrieve = retrieve;
    };
  });

  const service = () =>
    new Service(
      new GetSubscriptionService(new DatabaseService()),
      new PromotionRedemptionService(new DatabaseService())
    );

  test("Season Pass discloses $69 every 3 months, renewing automatically", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    await service().execute(dancer.id, dancer.email, { plan: "season_pass" });

    const [session] = sessions;
    assert.equal(session!.mode, "subscription");
    assert.deepEqual(session!.line_items, [
      { price: priceIdFor("season_pass"), quantity: 1 },
    ]);
    assert.equal(
      disclosure(session),
      "Renews automatically at $69.00 every 3 months until you cancel in Membership settings."
    );
    assert.isUndefined(session!.subscription_data);
  });

  test("a Week Pass holder's new plan is first charged when the pass ends", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const passEnd = new Date(Date.now() + 4 * DAY_MS);
    await buyWeekPass(dancer.id, passEnd);

    await service().execute(dancer.id, dancer.email, { plan: "season_pass" });

    const [session] = sessions;
    assert.equal(
      session!.subscription_data?.trial_end,
      Math.floor(passEnd.getTime() / 1000)
    );
    assert.match(
      disclosure(session)!,
      /^Your 1-Week Pass days are credited, so you pay nothing today\. Your first charge is on \w+ \d+, \d{4}\. Renews automatically at \$69\.00 every 3 months/
    );
  });

  test("a Week Pass bought by a Week Pass holder is a plain one-time payment", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    await buyWeekPass(dancer.id);

    await service().execute(dancer.id, dancer.email, { plan: "week_pass" });

    const [session] = sessions;
    assert.equal(session!.mode, "payment");
    assert.isUndefined(session!.subscription_data);
    assert.equal(
      disclosure(session),
      "One-time payment for 7 days of access. It does not renew."
    );
  });

  test("a member whose renewal failed updates the card instead of buying again", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    await subscribe(dancer.id, {
      status: "past_due",
      pastDueSince: new Date(Date.now() - 6 * DAY_MS),
    });

    await assert.rejects(
      () => service().execute(dancer.id, dancer.email, { plan: "monthly" }),
      /Your last payment didn't go through/
    );
    assert.lengthOf(sessions, 0);

    // Still inside the grace period, the subscription is live.
    await db
      .update(subscriptions)
      .set({ pastDueSince: new Date() })
      .where(eq(subscriptions.userId, dancer.id));
    await assert.rejects(
      () => service().execute(dancer.id, dancer.email, { plan: "monthly" }),
      /You already have a subscription/
    );
  });
});
