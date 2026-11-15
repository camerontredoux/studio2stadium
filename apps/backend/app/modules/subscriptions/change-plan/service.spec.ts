import { db } from "#database/connection";
import { subscriptions } from "#database/schema/subscriptions";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import { SyncSubscriptionService } from "#modules/subscriptions/sync-subscription/service";
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
import Stripe from "stripe";

const StripeErrors = Stripe.errors;
import { ChangePlanService } from "./service.ts";
import { schema } from "./validator.ts";

const seconds = (date: Date) => Math.floor(date.getTime() / 1000);
const YEAR_END = new Date(Date.now() + 365 * DAY_MS);

/**
 * A Stripe that holds one subscription. An update switches its price and
 * starts a year-long period, unless the card declines.
 */
function fakeStripe(row: { subscriptionId: string; customerId: string }) {
  const state = {
    id: row.subscriptionId,
    customer: row.customerId,
    status: "active",
    cancel_at_period_end: false,
    cancel_at: null as number | null,
    canceled_at: null,
    schedule: null,
    trial_end: null,
    items: {
      data: [
        {
          id: "si_test",
          price: { id: priceIdFor("monthly")! },
          current_period_end: seconds(new Date(Date.now() + 30 * DAY_MS)),
        },
      ],
    },
  };
  const fake = {
    state,
    declines: false,
    updates: [] as {
      params: Stripe.SubscriptionUpdateParams;
      key: string | undefined;
    }[],
    voided: [] as string[],
  };

  const subs = stripe.api.subscriptions;
  const invoices = stripe.api.invoices;
  const { retrieve, update } = subs;
  const { voidInvoice } = invoices;

  subs.retrieve = (async () =>
    structuredClone(state)) as unknown as typeof retrieve;
  subs.update = (async (
    _id: string,
    params: Stripe.SubscriptionUpdateParams,
    options?: Stripe.RequestOptions
  ) => {
    fake.updates.push({ params, key: options?.idempotencyKey });
    // Let a second request reach the lock while this one is in Stripe.
    await new Promise((resolve) => setTimeout(resolve, 20));
    if (fake.declines && params.items) {
      return {
        ...structuredClone(state),
        pending_update: { expires_at: seconds(new Date()) },
        latest_invoice: { id: "in_declined", status: "open" },
      };
    }
    if (params.items) {
      state.items.data[0]!.price.id = params.items[0]!.price!;
      state.items.data[0]!.current_period_end = seconds(YEAR_END);
    }
    if (params.cancel_at_period_end === false) {
      state.cancel_at_period_end = false;
      state.cancel_at = null;
    }
    return {
      ...structuredClone(state),
      pending_update: null,
      latest_invoice: params.items
        ? { id: "in_paid", status: "paid", amount_paid: 22500, total: 22500 }
        : null,
    };
  }) as unknown as typeof update;
  invoices.voidInvoice = (async (id: string) => {
    if (fake.voided.includes(id)) {
      throw new StripeErrors.StripeInvalidRequestError({
        type: "invalid_request_error",
        message: "You can only pass in open invoices.",
      });
    }
    fake.voided.push(id);
  }) as unknown as typeof voidInvoice;

  return {
    fake,
    restore: () => {
      subs.retrieve = retrieve;
      subs.update = update;
      invoices.voidInvoice = voidInvoice;
    },
  };
}

test.group("Change plan", (group) => {
  let restore = () => {};

  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    configurePlanPrices();
    return () => restore();
  });

  const service = () => {
    const dbService = new DatabaseService();
    return new ChangePlanService(
      dbService,
      new SyncSubscriptionService(dbService),
      new GetSubscriptionService(dbService)
    );
  };

  const subscribedDancer = async (
    options: Parameters<typeof subscribe>[1] = {}
  ) => {
    const dancer = await createDancer();
    await subscribe(dancer.id, options);
    const [row] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, dancer.id));
    const stripeFake = fakeStripe(row!);
    restore = stripeFake.restore;
    return { dancer, fake: stripeFake.fake };
  };

  const now = () => Math.floor(Date.now() / 1000);

  test("switches the subscription's price in place and the local record follows", async ({
    assert,
  }) => {
    const { dancer, fake } = await subscribedDancer();
    const prorationDate = now();

    const result = await service().execute(dancer.id, {
      plan: "annual",
      prorationDate,
    });

    assert.lengthOf(fake.updates, 1);
    const { params } = fake.updates[0]!;
    assert.deepEqual(params.items, [
      { id: "si_test", price: priceIdFor("annual") },
    ]);
    assert.equal(params.proration_behavior, "always_invoice");
    assert.equal(params.proration_date, prorationDate);
    assert.equal(params.payment_behavior, "pending_if_incomplete");

    assert.equal(result.amountPaid, 22500);
    assert.equal(result.status.plan, "annual");
    assert.equal(
      result.status.currentPeriodEnd?.getTime(),
      seconds(YEAR_END) * 1000
    );
  });

  test("a subscription set to cancel renews again after the switch", async ({
    assert,
  }) => {
    const { dancer, fake } = await subscribedDancer();
    fake.state.cancel_at_period_end = true;
    await db
      .update(subscriptions)
      .set({ cancelAtPeriodEnd: true })
      .where(eq(subscriptions.userId, dancer.id));

    const result = await service().execute(dancer.id, {
      plan: "season_pass",
      prorationDate: now(),
    });

    // One call, so a declined card leaves the cancellation in place too.
    assert.lengthOf(fake.updates, 1);
    assert.isFalse(fake.updates[0]!.params.cancel_at_period_end);
    assert.isFalse(result.status.cancelAtPeriodEnd);
    assert.equal(result.status.plan, "season_pass");
  });

  test("a member whose renewal failed updates the card first", async ({
    assert,
  }) => {
    const { dancer, fake } = await subscribedDancer({
      status: "past_due",
      pastDueSince: new Date(),
    });

    await assert.rejects(
      () =>
        service().execute(dancer.id, { plan: "annual", prorationDate: now() }),
      /Your last payment didn't go through/
    );
    assert.lengthOf(fake.updates, 0);
  });

  test("a declined card changes nothing and voids the switch's invoice, also on a resubmit", async ({
    assert,
  }) => {
    const { dancer, fake } = await subscribedDancer();
    fake.declines = true;
    const payload = { plan: "annual" as const, prorationDate: now() };

    const declined = () =>
      assert.rejects(
        () => service().execute(dancer.id, payload),
        /Your card was declined, so your plan didn't change/
      );

    await declined();
    // The resubmit gets the first reply again, whose invoice is now void.
    await declined();
    assert.deepEqual(fake.voided, ["in_declined"]);
    const status = await new GetSubscriptionService(
      new DatabaseService()
    ).execute(dancer.id);
    assert.equal(status.plan, "monthly");
  });

  test("a double submit switches once", async ({ assert }) => {
    const { dancer, fake } = await subscribedDancer();
    const payload = { plan: "annual" as const, prorationDate: now() };

    const results = await Promise.all([
      service().execute(dancer.id, payload),
      service().execute(dancer.id, payload),
    ]);

    assert.lengthOf(fake.updates, 1);
    assert.equal(
      fake.updates[0]!.key,
      `change-plan:${fake.state.id}:${priceIdFor("annual")}:${payload.prorationDate}`
    );
    assert.deepEqual(
      results.map((result) => result.status.plan),
      ["annual", "annual"]
    );
  });

  test("an old preview is reviewed again rather than charged", async ({
    assert,
  }) => {
    const { dancer, fake } = await subscribedDancer();

    await assert.rejects(
      () =>
        service().execute(dancer.id, {
          plan: "annual",
          prorationDate: now() - 31 * 60,
        }),
      /The price shown has expired/
    );
    assert.lengthOf(fake.updates, 0);
  });

  test("only Monthly, Season Pass and Annual can be switched to", async ({
    assert,
  }) => {
    for (const plan of ["week_pass", "free", "premium"]) {
      await assert.rejects(() =>
        schema.validate({ plan, prorationDate: now() })
      );
    }
  });
});
