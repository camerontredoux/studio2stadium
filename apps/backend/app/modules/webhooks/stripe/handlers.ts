import { subscriptions } from "#database/schema/subscriptions";
import { DatabaseService } from "#database/service";
import stripe from "#payments/stripe/main";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type Stripe } from "stripe";
import { SubscriptionCreatedEvent, SubscriptionDeletedEvent } from "./event.ts";

@inject()
export default class WebhookHandlers {
  constructor(private db: DatabaseService) {
    stripe.onEvent(
      "checkout.session.completed",
      this.checkoutSessionCompleted.bind(this)
    );
    stripe.onEvent(
      "customer.subscription.updated",
      this.subscriptionUpdated.bind(this)
    );
    stripe.onEvent(
      "customer.subscription.deleted",
      this.subscriptionDeleted.bind(this)
    );
  }

  // Initial checkout — create the subscription record and link the customer
  async checkoutSessionCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;

    if (!userId || !session.subscription) return;

    const subscription = await stripe.api.subscriptions.retrieve(
      session.subscription as string
    );

    const item = subscription.items.data[0];

    const priceId = item.price.id;
    const currentPeriodEnd = item.current_period_end;

    const [user] = await this.db.use((db) =>
      db
        .insert(subscriptions)
        .values({
          userId,
          source: "stripe",
          status: subscription.status,
          subscriptionId: subscription.id,
          customerId: subscription.customer as string,
          priceId,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(currentPeriodEnd * 1000),
        })
        .returning({
          id: subscriptions.userId,
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            status: subscription.status,
            subscriptionId: subscription.id,
            customerId: subscription.customer as string,
            priceId,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd: new Date(currentPeriodEnd * 1000),
            canceledAt: null,
          },
        })
    );

    if (user) {
      SubscriptionCreatedEvent.dispatch({ userId: user.id });
    }
  }

  // Handles everything after initial creation — renewals, cancellations, plan changes, payment failures
  async subscriptionUpdated(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    const item = subscription.items.data[0];

    const priceId = item.price.id;
    const currentPeriodEnd = item.current_period_end;

    await this.db.use((db) =>
      db
        .update(subscriptions)
        .set({
          status: subscription.status,
          priceId,
          cancelAtPeriodEnd:
            subscription.cancel_at_period_end ||
            subscription.cancel_at !== null,
          currentPeriodEnd: new Date(currentPeriodEnd * 1000),
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.subscriptionId, subscription.id))
    );
  }

  // Fired when a subscription is fully deleted
  async subscriptionDeleted(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;

    await this.db.use((db) =>
      db
        .update(subscriptions)
        .set({
          status: "canceled",
          canceledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.subscriptionId, subscription.id))
    );

    // Get customer email from Stripe (user may already be deleted from DB)
    const customer = await stripe.api.customers.retrieve(
      subscription.customer as string
    );

    if (!customer.deleted && customer.email) {
      // Webhook events aren't triggered by admin users directly
      SubscriptionDeletedEvent.dispatch({
        email: customer.email,
        name: customer.name || "there",
        isAdmin: false,
      });
    }
  }
}
