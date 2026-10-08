import { db } from "#database/connection";
import { subscriptions } from "#database/schema/subscriptions";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import stripe from "#payments/stripe/main";
import emitter from "@adonisjs/core/services/emitter";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
import type { Stripe } from "stripe";
import { createDancer, DAY_MS } from "#tests/helpers/premium";
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

  function stripeReturns(id: string, startDate: Date) {
    stripe.api.subscriptions.retrieve = (async () => ({
      id,
      status: "active",
      customer: "cus_test",
      cancel_at_period_end: false,
      start_date: seconds(startDate),
      items: {
        data: [
          {
            price: { id: "price_test" },
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
    const handlers = new WebhookHandlers(new DatabaseService());
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
});
