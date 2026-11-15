import { subscriptions } from "#database/schema/subscriptions";
import type { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import stripe from "#payments/stripe/main";
import {
  priceIdFor,
  subscriptionAccessEndsAt,
  type SubscriptionPlan,
} from "#shared/plans";
import { eq } from "drizzle-orm";
import { type Stripe } from "stripe";

/**
 * A member with a live Stripe subscription can switch it to any of these in
 * place. The Week Pass is a one-time payment, and Free is a cancellation in
 * the billing portal.
 */
export const SWITCHABLE_PLANS = [
  "monthly",
  "season_pass",
  "annual",
] as const satisfies readonly SubscriptionPlan[];

export const NO_SUBSCRIPTION =
  "You don't have a subscription to change. See plans to subscribe.";
export const PAYMENT_FAILED =
  "Your last payment didn't go through. Update your card from Manage billing before you change plans.";

/**
 * Stripe settings shared by the preview and the change, so the amounts shown
 * are the amounts charged. The switch is billed now: the unused part of the
 * current plan is credited against the new plan, and Stripe charges the
 * difference at once or adds a surplus to the member's balance.
 */
export const PRORATION = "always_invoice" as const;

export interface Switch {
  subscription: Stripe.Subscription;
  item: Stripe.SubscriptionItem;
  /** The Stripe Price of the plan the member is switching to. */
  price: string;
  /** The member is already on the plan asked for. */
  alreadyOnPlan: boolean;
  /** The subscription is set to cancel; switching keeps it instead. */
  pendingCancellation: boolean;
}

/**
 * The member's own live subscription and the price to switch it to. Refuses
 * a member without one, and one whose renewal payment failed: they update
 * their card first. Stripe is asked for the subscription, so the switch is
 * based on its plan and status now, not the local copy.
 */
export async function findSwitch(
  db: DatabaseService,
  userId: string,
  plan: SubscriptionPlan
): Promise<Switch> {
  const price = priceIdFor(plan);
  if (!price) {
    throw new E_BAD_REQUEST("This plan isn't available yet.");
  }

  const [row] = await db.use((tx) =>
    tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1)
  );

  if (!row || row.source !== "stripe") {
    throw new E_BAD_REQUEST(NO_SUBSCRIPTION);
  }
  if (row.status === "past_due") {
    throw new E_BAD_REQUEST(PAYMENT_FAILED);
  }
  if (!subscriptionAccessEndsAt(row)) {
    throw new E_BAD_REQUEST(NO_SUBSCRIPTION);
  }

  const subscription = await stripe.api.subscriptions.retrieve(
    row.subscriptionId
  );
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  if (customerId !== row.customerId) {
    throw new E_BAD_REQUEST(NO_SUBSCRIPTION);
  }
  if (["past_due", "unpaid", "incomplete"].includes(subscription.status)) {
    throw new E_BAD_REQUEST(PAYMENT_FAILED);
  }
  if (!["active", "trialing"].includes(subscription.status)) {
    throw new E_BAD_REQUEST(NO_SUBSCRIPTION);
  }

  const [item, ...rest] = subscription.items.data;
  if (!item || rest.length > 0 || subscription.schedule) {
    throw new E_BAD_REQUEST(
      "This subscription can't be changed here. Use Manage billing instead."
    );
  }

  return {
    subscription,
    item,
    price,
    alreadyOnPlan: item.price.id === price,
    pendingCancellation:
      subscription.cancel_at_period_end || subscription.cancel_at !== null,
  };
}
