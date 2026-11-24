import { db } from "#database/connection";
import { promotionCodeRedemptions } from "#database/schema/promotion-redemptions";
import { subscriptions } from "#database/schema/subscriptions";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { Service as CreateCheckoutService } from "#modules/subscriptions/create-checkout/service";
import {
  FulfillCheckoutService,
  type CompletedSession,
} from "#modules/subscriptions/fulfill-checkout/service";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import stripe from "#payments/stripe/main";
import { priceIdFor } from "#shared/plans";
import {
  configurePlanPrices,
  createDancer,
  DAY_MS,
} from "#tests/helpers/premium";
import emitter from "@adonisjs/core/services/emitter";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
import type { Stripe } from "stripe";
import { PromotionRedemptionService } from "./service.ts";

const seconds = (date: Date) => Math.floor(date.getTime() / 1000);

/** Promotion codes as the Stripe Dashboard holds them, by id. */
const PROMOTION_CODES: Record<string, string> = {
  promo_s2ssave: "S2SSAVE",
  promo_other: "SPRING10",
};

function seasonPassSession(
  userId: string,
  id: string,
  promotionCode: string | null
): CompletedSession {
  return {
    id,
    client_reference_id: userId,
    subscription: `sub_${id}`,
    metadata: {},
    payment_status: "paid",
    payment_intent: null,
    discounts: promotionCode
      ? [{ coupon: "coupon_test", promotion_code: promotionCode }]
      : [],
  };
}

const redemptionsOf = (userId: string) =>
  db
    .select()
    .from(promotionCodeRedemptions)
    .where(eq(promotionCodeRedemptions.userId, userId));

test.group("Once-per-account promotion codes", (group) => {
  let sessions: Stripe.Checkout.SessionCreateParams[] = [];

  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    configurePlanPrices();
    emitter.fake();
    sessions = [];

    const original = {
      create: stripe.api.checkout.sessions.create,
      price: stripe.api.prices.retrieve,
      subscription: stripe.api.subscriptions.retrieve,
      promotionCode: stripe.api.promotionCodes.retrieve,
    };
    stripe.api.checkout.sessions.create = (async (
      params: Stripe.Checkout.SessionCreateParams
    ) => {
      sessions.push(params);
      return { client_secret: "cs_secret" };
    }) as unknown as typeof original.create;
    stripe.api.prices.retrieve = (async () => ({
      unit_amount: 6900,
      currency: "usd",
      recurring: { interval: "month", interval_count: 3 },
    })) as unknown as typeof original.price;
    stripe.api.subscriptions.retrieve = (async (id: string) => ({
      id,
      status: "active",
      customer: "cus_test",
      cancel_at_period_end: false,
      start_date: seconds(new Date()),
      items: {
        data: [
          {
            price: { id: priceIdFor("season_pass") },
            current_period_end: seconds(new Date(Date.now() + 90 * DAY_MS)),
          },
        ],
      },
    })) as unknown as typeof original.subscription;
    stripe.api.promotionCodes.retrieve = (async (id: string) => ({
      id,
      code: PROMOTION_CODES[id],
    })) as unknown as typeof original.promotionCode;

    return () => {
      stripe.api.checkout.sessions.create = original.create;
      stripe.api.prices.retrieve = original.price;
      stripe.api.subscriptions.retrieve = original.subscription;
      stripe.api.promotionCodes.retrieve = original.promotionCode;
      emitter.restore();
    };
  });

  const dbService = new DatabaseService();
  const promotions = new PromotionRedemptionService(dbService);
  const fulfill = new FulfillCheckoutService(dbService);
  const createCheckout = () =>
    new CreateCheckoutService(
      new GetSubscriptionService(dbService),
      promotions
    );

  test("an account that never used S2SSAVE may enter promotion codes", async ({
    assert,
  }) => {
    const dancer = await createDancer();

    await createCheckout().execute(dancer.id, dancer.email, {
      plan: "season_pass",
    });

    assert.isTrue(sessions[0]!.allow_promotion_codes);
  });

  test("S2SSAVE is recorded once per account, however often the session is fulfilled", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const session = seasonPassSession(dancer.id, "cs_bf", "promo_s2ssave");

    await fulfill.execute(session);
    await fulfill.execute(session);

    const rows = await redemptionsOf(dancer.id);
    assert.lengthOf(rows, 1);
    assert.equal(rows[0]!.code, "S2SSAVE");
    assert.equal(rows[0]!.promotionCodeId, "promo_s2ssave");
    assert.equal(rows[0]!.checkoutSessionId, "cs_bf");
    assert.isTrue(await promotions.hasRedeemed(dancer.id));
  });

  test("an expanded promotion code is read without asking Stripe, in any case", async ({
    assert,
  }) => {
    const dancer = await createDancer();

    await promotions.record(dancer.id, {
      id: "cs_expanded",
      discounts: [
        {
          coupon: null,
          promotion_code: {
            id: "promo_s2ssave",
            code: "s2ssave",
          } as Stripe.PromotionCode,
        },
      ],
    });

    assert.isTrue(await promotions.hasRedeemed(dancer.id));
  });

  test("other codes and undiscounted checkouts are not recorded", async ({
    assert,
  }) => {
    const dancer = await createDancer();

    await fulfill.execute(seasonPassSession(dancer.id, "cs_plain", null));
    await fulfill.execute(
      seasonPassSession(dancer.id, "cs_other", "promo_other")
    );

    assert.lengthOf(await redemptionsOf(dancer.id), 0);
    assert.isFalse(await promotions.hasRedeemed(dancer.id));
  });

  test("after cancelling, a returning subscriber who used S2SSAVE cannot enter it again", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const other = await createDancer();

    await fulfill.execute(
      seasonPassSession(dancer.id, "cs_first", "promo_s2ssave")
    );
    await db
      .update(subscriptions)
      .set({
        status: "canceled",
        currentPeriodEnd: new Date(Date.now() - DAY_MS),
      })
      .where(eq(subscriptions.userId, dancer.id));

    await createCheckout().execute(dancer.id, dancer.email, {
      plan: "season_pass",
    });
    await createCheckout().execute(other.id, other.email, {
      plan: "season_pass",
    });

    const [returning, fresh] = sessions;
    assert.isFalse(returning!.allow_promotion_codes);
    // Still the $69 Season Pass, just without a code field.
    assert.deepEqual(returning!.line_items, [
      { price: priceIdFor("season_pass"), quantity: 1 },
    ]);
    assert.equal(returning!.mode, "subscription");
    // Another account is unaffected.
    assert.isTrue(fresh!.allow_promotion_codes);
  });
});
