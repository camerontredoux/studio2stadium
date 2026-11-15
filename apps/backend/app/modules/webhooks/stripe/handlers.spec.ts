import { db } from "#database/connection";
import { subscriptions } from "#database/schema/subscriptions";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import stripe from "#payments/stripe/main";
import emitter from "@adonisjs/core/services/emitter";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
import type { Stripe } from "stripe";
import {
  configurePlanPrices,
  createDancer,
  DAY_MS,
} from "#tests/helpers/premium";
import { DeactivatePurchaseService } from "#modules/event-tiers/deactivation/service";
import { ProvisionPurchaseService } from "#modules/event-tiers/provisioning/service";
import { FulfillCheckoutService } from "#modules/subscriptions/fulfill-checkout/service";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import { weekPasses } from "#database/schema/subscriptions";
import { priceIdFor } from "#shared/plans";
import { SubscriptionCreatedEvent } from "./event.ts";
import WebhookHandlers from "./handlers.ts";

const seconds = (date: Date) => Math.floor(date.getTime() / 1000);

function checkoutCompleted(userId: string, subscriptionId: string) {
  return {
    data: {
      object: { client_reference_id: userId, subscription: subscriptionId },
    },
  } as unknown as Stripe.Event;
}

test.group("Stripe checkout webhook", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    emitter.fake();
    const retrieve = stripe.api.subscriptions.retrieve;
    return () => {
      stripe.api.subscriptions.retrieve = retrieve;
      emitter.restore();
    };
  });

  function stripeReturns(id: string, startDate: Date, priceId = "price_test") {
    stripe.api.subscriptions.retrieve = (async () => ({
      id,
      status: "active",
      customer: "cus_test",
      cancel_at_period_end: false,
      start_date: seconds(startDate),
      items: {
        data: [
          {
            price: { id: priceId },
            current_period_end: seconds(new Date(Date.now() + 30 * DAY_MS)),
          },
        ],
      },
    })) as unknown as typeof stripe.api.subscriptions.retrieve;
  }

  test("sets started_at from Stripe, and a checkout after a lapse resets it", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const dbService = new DatabaseService();
    const handlers = new WebhookHandlers(
      dbService,
      new ProvisionPurchaseService(dbService),
      new DeactivatePurchaseService(dbService),
      new FulfillCheckoutService(dbService)
    );
    const startedAtOf = async () => {
      const [row] = await db
        .select({ startedAt: subscriptions.startedAt })
        .from(subscriptions)
        .where(eq(subscriptions.userId, dancer.id));
      return row!.startedAt!.getTime();
    };

    const first = new Date(Date.now() - 90 * DAY_MS);
    stripeReturns("sub_first", first);
    await handlers.checkoutSessionCompleted(
      checkoutCompleted(dancer.id, "sub_first")
    );
    assert.equal(await startedAtOf(), seconds(first) * 1000);

    await db
      .update(subscriptions)
      .set({ status: "canceled" })
      .where(eq(subscriptions.userId, dancer.id));

    const second = new Date();
    stripeReturns("sub_second", second);
    await handlers.checkoutSessionCompleted(
      checkoutCompleted(dancer.id, "sub_second")
    );
    assert.equal(await startedAtOf(), seconds(second) * 1000);
  });
  // Each plan's checkout reaches the Dancer's status as that plan, and a
  // redelivered event fulfils once.
  function plansHandlers(provision: ProvisionPurchaseService) {
    const dbService = new DatabaseService();
    return new WebhookHandlers(
      dbService,
      provision,
      new DeactivatePurchaseService(dbService),
      new FulfillCheckoutService(dbService)
    );
  }

  const statusOf = (userId: string) =>
    new GetSubscriptionService(new DatabaseService()).execute(userId);

  test("Monthly, Season Pass and Annual checkouts give Premium on that plan, once", async ({
    assert,
  }) => {
    configurePlanPrices();
    const events = emitter.fake();
    const handlers = plansHandlers(
      new ProvisionPurchaseService(new DatabaseService())
    );

    for (const plan of ["monthly", "season_pass", "annual"] as const) {
      const dancer = await createDancer();
      stripeReturns(`sub_${plan}`, new Date(), priceIdFor(plan));

      await handlers.checkoutSessionCompleted(
        checkoutCompleted(dancer.id, `sub_${plan}`)
      );
      await handlers.checkoutSessionCompleted(
        checkoutCompleted(dancer.id, `sub_${plan}`)
      );

      assert.deepInclude(await statusOf(dancer.id), {
        subscribed: true,
        access: "premium",
        plan,
        source: "stripe",
      });
    }

    // One welcome email per Dancer, though each event arrived twice.
    events.assertEmittedCount(SubscriptionCreatedEvent, 3);
  });

  test("a Week Pass payment gives seven days of pass access and is not an Event Tier purchase", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const handlers = plansHandlers({
      execute: async () => {
        throw new Error("a Week Pass was provisioned as an Event Tier");
      },
    } as unknown as ProvisionPurchaseService);
    const event = {
      data: {
        object: {
          id: "cs_test_week_pass",
          mode: "payment",
          payment_status: "paid",
          payment_intent: "pi_test_week_pass",
          client_reference_id: dancer.id,
          metadata: { purchase: "week_pass" },
        },
      },
    } as unknown as Stripe.Event;

    await handlers.checkoutSessionCompleted(event);
    await handlers.checkoutSessionCompleted(event);

    const status = await statusOf(dancer.id);
    assert.deepInclude(status, {
      subscribed: true,
      access: "pass",
      plan: "week_pass",
      source: "week_pass",
    });
    const days = (status.currentPeriodEnd!.getTime() - Date.now()) / DAY_MS;
    assert.closeTo(days, 7, 0.01);

    const rows = await db
      .select()
      .from(weekPasses)
      .where(eq(weekPasses.userId, dancer.id));
    assert.lengthOf(rows, 1);
    assert.equal(rows[0]!.paymentIntentId, "pi_test_week_pass");
  });
});
