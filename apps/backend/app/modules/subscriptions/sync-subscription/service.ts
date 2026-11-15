import { subscriptions } from "#database/schema/subscriptions";
import { DatabaseService } from "#database/service";
import { PaymentFailedEvent } from "#modules/webhooks/stripe/event";
import { pastDueGraceEndsAt } from "#shared/plans";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type Stripe } from "stripe";

/** The fields of a Stripe Subscription that the local record copies. */
export type SyncedSubscription = Pick<
  Stripe.Subscription,
  "id" | "status" | "cancel_at_period_end" | "cancel_at" | "canceled_at"
> & {
  items: {
    data: Pick<Stripe.SubscriptionItem, "price" | "current_period_end">[];
  };
};

/**
 * Copy a Stripe subscription's plan, period, status and pending cancellation
 * onto its local record. The `customer.subscription.updated` webhook calls
 * this for every change, and an in-app plan change calls it so the new plan
 * shows before the webhook arrives; both write the same values.
 *
 * A renewal whose payment fails moves the subscription to past_due; the
 * member keeps access for a grace period from the first such update
 * (`PAST_DUE_GRACE_DAYS`) and is emailed once to update their card. A later
 * successful payment moves it back to active and clears the grace.
 */
@inject()
export class SyncSubscriptionService {
  constructor(private db: DatabaseService) {}

  /** `at` is when Stripe reported this state: the event's time, or now. */
  async execute(subscription: SyncedSubscription, at: Date) {
    const item = subscription.items.data[0]!;
    const pastDue = subscription.status === "past_due";

    const failed = await this.db.tx(async (tx) => {
      const [row] = await tx
        .select({
          userId: subscriptions.userId,
          pastDueSince: subscriptions.pastDueSince,
        })
        .from(subscriptions)
        .where(eq(subscriptions.subscriptionId, subscription.id))
        .for("update");

      const pastDueSince = pastDue ? (row?.pastDueSince ?? at) : null;

      await tx
        .update(subscriptions)
        .set({
          status: subscription.status,
          priceId: item.price.id,
          cancelAtPeriodEnd:
            subscription.cancel_at_period_end ||
            subscription.cancel_at !== null,
          currentPeriodEnd: new Date(item.current_period_end * 1000),
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : null,
          pastDueSince,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.subscriptionId, subscription.id));

      // Only the update that first moves the subscription to past_due sends
      // the notice; later retries and redeliveries find the grace started.
      return row && pastDueSince && !row.pastDueSince
        ? { userId: row.userId, pastDueSince }
        : null;
    });

    if (failed) {
      PaymentFailedEvent.dispatch({
        userId: failed.userId,
        accessEndsAt: pastDueGraceEndsAt(failed.pastDueSince),
      });
    }
  }
}
