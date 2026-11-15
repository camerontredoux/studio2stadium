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
  buyWeekPass,
  configurePlanPrices,
  createDancer,
  DAY_MS,
  subscribe,
} from "#tests/helpers/premium";
import { DeactivatePurchaseService } from "#modules/event-tiers/deactivation/service";
import { ProvisionPurchaseService } from "#modules/event-tiers/provisioning/service";
import { FulfillCheckoutService } from "#modules/subscriptions/fulfill-checkout/service";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import { RevokeWeekPassService } from "#modules/subscriptions/revoke-week-pass/service";
import { SyncSubscriptionService } from "#modules/subscriptions/sync-subscription/service";
import { weekPasses } from "#database/schema/subscriptions";
import { priceIdFor } from "#shared/plans";
import { PaymentFailedEvent, SubscriptionCreatedEvent } from "./event.ts";
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
      new FulfillCheckoutService(dbService),
      new RevokeWeekPassService(dbService),
      new SyncSubscriptionService(dbService)
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
      new FulfillCheckoutService(dbService),
      new RevokeWeekPassService(dbService),
      new SyncSubscriptionService(dbService)
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

  // A subscription.updated event for `subscriptionId` with this status.
  function subscriptionUpdated(
    subscriptionId: string,
    status: Stripe.Subscription.Status,
    created: Date,
    periodEnd = new Date(created.getTime() + 30 * DAY_MS)
  ) {
    return {
      created: seconds(created),
      data: {
        object: {
          id: subscriptionId,
          status,
          cancel_at_period_end: false,
          cancel_at: null,
          canceled_at: null,
          items: {
            data: [
              {
                price: { id: priceIdFor("monthly") },
                current_period_end: seconds(periodEnd),
              },
            ],
          },
        },
      },
    } as unknown as Stripe.Event;
  }

  const subscriptionIdOf = async (userId: string) => {
    const [row] = await db
      .select({ id: subscriptions.subscriptionId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return row!.id;
  };

  test("a failed renewal keeps Premium for 5 days, emails once, and a later payment restores it", async ({
    assert,
  }) => {
    configurePlanPrices();
    const events = emitter.fake();
    const handlers = plansHandlers(
      new ProvisionPurchaseService(new DatabaseService())
    );
    const dancer = await createDancer();
    await subscribe(dancer.id);
    const subscriptionId = await subscriptionIdOf(dancer.id);

    // Stripe moves the subscription into its next period, then the charge
    // fails. The event arrives twice, and again on a later retry.
    const failedAt = new Date(Date.now() - 60_000);
    const failed = subscriptionUpdated(subscriptionId, "past_due", failedAt);
    await handlers.subscriptionUpdated(failed);
    await handlers.subscriptionUpdated(failed);
    await handlers.subscriptionUpdated(
      subscriptionUpdated(subscriptionId, "past_due", new Date())
    );

    const graceEnd = new Date(seconds(failedAt) * 1000 + 5 * DAY_MS);
    assert.deepInclude(await statusOf(dancer.id), {
      subscribed: true,
      access: "premium",
      source: "stripe",
      paymentFailed: true,
      currentPeriodEnd: graceEnd,
    });
    events.assertEmittedCount(PaymentFailedEvent, 1);
    events.assertEmitted(
      PaymentFailedEvent,
      ({ data: event }) =>
        event.data.userId === dancer.id &&
        event.data.accessEndsAt.getTime() === graceEnd.getTime()
    );

    // Five days after the failure, access is gone, though Stripe still
    // shows the subscription past_due and it still needs a new card.
    await db
      .update(subscriptions)
      .set({ pastDueSince: new Date(Date.now() - 5 * DAY_MS - 60_000) })
      .where(eq(subscriptions.userId, dancer.id));
    assert.deepInclude(await statusOf(dancer.id), {
      subscribed: false,
      access: "free",
      paymentFailed: true,
    });

    // A retry or a new card succeeds.
    await handlers.subscriptionUpdated(
      subscriptionUpdated(subscriptionId, "active", new Date())
    );
    assert.deepInclude(await statusOf(dancer.id), {
      subscribed: true,
      access: "premium",
      paymentFailed: false,
    });
    const [row] = await db
      .select({ pastDueSince: subscriptions.pastDueSince })
      .from(subscriptions)
      .where(eq(subscriptions.userId, dancer.id));
    assert.isNull(row!.pastDueSince);
  });

  test("a subscription that fails again after recovering sends a new notice", async () => {
    configurePlanPrices();
    const events = emitter.fake();
    const handlers = plansHandlers(
      new ProvisionPurchaseService(new DatabaseService())
    );
    const dancer = await createDancer();
    await subscribe(dancer.id);
    const subscriptionId = await subscriptionIdOf(dancer.id);

    for (const status of ["past_due", "active", "past_due"] as const) {
      await handlers.subscriptionUpdated(
        subscriptionUpdated(subscriptionId, status, new Date())
      );
    }

    events.assertEmittedCount(PaymentFailedEvent, 2);
  });

  // A charge.refunded or charge.dispute.created event for a payment.
  const refunded = (paymentIntent: string, fully = true) =>
    ({
      data: {
        object: {
          id: "ch_test",
          refunded: fully,
          payment_intent: paymentIntent,
        },
      },
    }) as unknown as Stripe.Event;
  const disputed = (paymentIntent: string) =>
    ({
      data: { object: { id: "dp_test", payment_intent: paymentIntent } },
    }) as unknown as Stripe.Event;

  const passesOf = (userId: string) =>
    db
      .select()
      .from(weekPasses)
      .where(eq(weekPasses.userId, userId))
      .orderBy(weekPasses.startsAt);

  test("a fully refunded Week Pass ends that pass and nothing else", async ({
    assert,
  }) => {
    const handlers = plansHandlers(
      new ProvisionPurchaseService(new DatabaseService())
    );

    // A pass running now and a second one stacked after it.
    const dancer = await createDancer();
    await buyWeekPass(dancer.id, new Date(Date.now() + 3 * DAY_MS));
    await buyWeekPass(dancer.id, new Date(Date.now() + 10 * DAY_MS));
    const [running, stacked] = await passesOf(dancer.id);
    await db
      .update(weekPasses)
      .set({ paymentIntentId: "pi_running" })
      .where(eq(weekPasses.id, running!.id));
    await db
      .update(weekPasses)
      .set({ paymentIntentId: "pi_stacked" })
      .where(eq(weekPasses.id, stacked!.id));

    // A partial refund is a concession, not the purchase taken back.
    await handlers.chargeRefunded(refunded("pi_running", false));
    const [afterPartial] = await passesOf(dancer.id);
    assert.isNull(afterPartial!.revokedAt);

    await handlers.chargeRefunded(refunded("pi_running"));
    await handlers.chargeRefunded(refunded("pi_running"));

    const [revoked, untouched] = await passesOf(dancer.id);
    assert.isNotNull(revoked!.revokedAt);
    assert.isAtMost(revoked!.endsAt.getTime(), Date.now());
    assert.isNull(untouched!.revokedAt);
    assert.equal(untouched!.endsAt.getTime(), stacked!.endsAt.getTime());

    // The stacked pass gives access once it starts, not before: the refunded
    // days are not handed back through it.
    assert.deepInclude(await statusOf(dancer.id), {
      subscribed: false,
      access: "free",
    });
  });

  test("a disputed Week Pass ends that pass and leaves a subscription alone", async ({
    assert,
  }) => {
    configurePlanPrices();
    const handlers = plansHandlers(
      new ProvisionPurchaseService(new DatabaseService())
    );

    const dancer = await createDancer();
    await subscribe(dancer.id);
    await buyWeekPass(dancer.id);
    await db
      .update(weekPasses)
      .set({ paymentIntentId: "pi_disputed" })
      .where(eq(weekPasses.userId, dancer.id));

    await handlers.chargeDisputeCreated(disputed("pi_disputed"));

    const [pass] = await passesOf(dancer.id);
    assert.isNotNull(pass!.revokedAt);
    assert.deepInclude(await statusOf(dancer.id), {
      subscribed: true,
      access: "premium",
      source: "stripe",
    });

    // A pass alone, disputed, leaves the Dancer on Free.
    const passOnly = await createDancer();
    await buyWeekPass(passOnly.id);
    await db
      .update(weekPasses)
      .set({ paymentIntentId: "pi_pass_only" })
      .where(eq(weekPasses.userId, passOnly.id));
    await handlers.chargeDisputeCreated(disputed("pi_pass_only"));
    assert.deepInclude(await statusOf(passOnly.id), {
      subscribed: false,
      access: "free",
    });
  });
});
