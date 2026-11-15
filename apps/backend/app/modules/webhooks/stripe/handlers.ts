import { subscriptions } from "#database/schema/subscriptions";
import { DatabaseService } from "#database/service";
import {
  disputeToDeactivation,
  refundToDeactivation,
} from "#modules/event-tiers/deactivation/payment-events";
import {
  DeactivatePurchaseService,
  type DeactivateInput,
} from "#modules/event-tiers/deactivation/service";
import { toProvisionInput } from "#modules/event-tiers/provisioning/checkout-session";
import { ProvisionPurchaseService } from "#modules/event-tiers/provisioning/service";
import {
  FulfillCheckoutService,
  isWeekPassSession,
} from "#modules/subscriptions/fulfill-checkout/service";
import stripe from "#payments/stripe/main";
import { inject } from "@adonisjs/core";
import logger from "@adonisjs/core/services/logger";
import { eq } from "drizzle-orm";
import { type Stripe } from "stripe";
import { SubscriptionDeletedEvent } from "./event.ts";

@inject()
export default class WebhookHandlers {
  constructor(
    private db: DatabaseService,
    private provisionPurchase: ProvisionPurchaseService,
    private deactivatePurchase: DeactivatePurchaseService,
    private fulfillCheckout: FulfillCheckoutService
  ) {
    stripe.onEvent(
      "checkout.session.completed",
      this.checkoutSessionCompleted.bind(this)
    );
    stripe.onEvent("charge.refunded", this.chargeRefunded.bind(this));
    stripe.onEvent(
      "charge.dispute.created",
      this.chargeDisputeCreated.bind(this)
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

  // A completed checkout. One-time payment sessions are Event Tier purchases
  // (ADR 0001) unless marked as a Dancer's 1-Week Pass; the Week Pass and
  // the Dancer subscriptions go to fulfilment.
  async checkoutSessionCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === "payment" && !isWeekPassSession(session)) {
      return await this.eventTierPurchased(session);
    }

    await this.fulfillCheckout.execute(session);
  }

  // A paid Event Tier purchase becomes the buyer's account (found by, or
  // created for, the email typed at checkout), an Org, its Org Event and the
  // buyer's organizer admin membership, and the buyer is emailed how to get
  // in. A translator only: reading the session and
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

  // A refunded or disputed Event Tier purchase stands its Org Event down and
  // tells staff (ADR 0005). Translators only: reading the charge or dispute and
  // deactivating are both tested on their own. Deactivation is idempotent on
  // the purchase, and payments that bought no Org Event — Dancer subscriptions
  // — are left alone.
  async chargeRefunded(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    await this.eventTierPaymentReversed(refundToDeactivation(charge));
  }

  async chargeDisputeCreated(event: Stripe.Event) {
    const dispute = event.data.object as Stripe.Dispute;
    await this.eventTierPaymentReversed(disputeToDeactivation(dispute));
  }

  async eventTierPaymentReversed(input: DeactivateInput | null) {
    if (!input) return;

    const result = await this.deactivatePurchase.execute(input);
    if (result.outcome === "not_an_event_tier_purchase") return;

    logger.warn(
      {
        paymentIntentId: input.paymentIntentId,
        reason: input.reason,
        providerReference: input.providerReference,
        purchaseId: result.purchase.id,
        eventId: result.purchase.eventId,
        outcome: result.outcome,
      },
      result.outcome === "deactivated"
        ? "Event Tier purchase reversed; Org Event deactivated"
        : "Event Tier purchase reversal already handled"
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
