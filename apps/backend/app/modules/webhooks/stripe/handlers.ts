import { subscriptions } from "#database/schema/subscriptions";
import { DatabaseService } from "#database/service";
import { toProvisionInput } from "#modules/event-tiers/provisioning/checkout-session";
import { ProvisionPurchaseService } from "#modules/event-tiers/provisioning/service";
import stripe from "#payments/stripe/main";
import { inject } from "@adonisjs/core";
import logger from "@adonisjs/core/services/logger";
import { eq } from "drizzle-orm";
import { type Stripe } from "stripe";
import { SubscriptionCreatedEvent, SubscriptionDeletedEvent } from "./event.ts";

@inject()
export default class WebhookHandlers {
  constructor(
    private db: DatabaseService,
    private provisionPurchase: ProvisionPurchaseService
  ) {
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

  // Initial checkout — create the subscription record and link the customer.
  // One-time payment sessions are Event Tier purchases (ADR 0001), the only
  // thing this app sells without a subscription, and go to provisioning.
  async checkoutSessionCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === "payment") {
      return await this.eventTierPurchased(session);
    }

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

  // A paid Event Tier purchase becomes an Org, its Org Event and the buyer's
  // organizer admin membership. A translator only: reading the session and
  // provisioning are both tested on their own. Provisioning is idempotent on
  // the session id, so a redelivered event returns the customer it already
  // built; a session that cannot be provisioned throws, which fails the
  // delivery for Stripe to retry rather than dropping a paid purchase.
  async eventTierPurchased(session: Stripe.Checkout.Session) {
    const result = await this.provisionPurchase.execute(
      await toProvisionInput(session)
    );

    logger.info(
      {
        sessionId: session.id,
        orgSlug: result.org.slug,
        eventId: result.event.id,
        provisioned: result.provisioned,
      },
      result.provisioned
        ? "Event Tier purchase provisioned"
        : "Event Tier purchase already provisioned"
    );
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
      SubscriptionDeletedEvent.dispatch({
        email: customer.email,
        name: customer.name || "there",
      });
    }
  }
}
