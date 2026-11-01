import { E_BAD_REQUEST } from "#exceptions/bad-request";
import stripe from "#payments/stripe/main";
import env from "#start/env";
import { inject } from "@adonisjs/core";
import { type Stripe } from "stripe";
import { type CheckoutMetadata } from "./metadata.ts";
import { type PurchasableEventTier, type Validator } from "./validator.ts";

/**
 * One Stripe one-time Price per self-serve Event Tier. Kept here rather than
 * alongside `EVENT_TIER_DEFINITIONS`: what a tier includes is product truth
 * shared by the whole app, but what Stripe object charges for it is
 * deployment configuration, same as `STRIPE_PRICE_ID_MONTHLY`/`_YEARLY`.
 */
const EVENT_TIER_PRICE_IDS: Record<PurchasableEventTier, string> = {
  core: env.get("STRIPE_PRICE_ID_EVENT_TIER_CORE"),
  regional: env.get("STRIPE_PRICE_ID_EVENT_TIER_REGIONAL"),
  national: env.get("STRIPE_PRICE_ID_EVENT_TIER_NATIONAL"),
};

/**
 * Start an Event Tier purchase: a Checkout Session and nothing else.
 *
 * No account is looked up or created. The buyer is a name and email carried on
 * the session, and provisioning turns them into an account only once the
 * payment lands (ADR 0007), so an abandoned checkout leaves no trace here.
 */
@inject()
export class Service {
  async execute(payload: Validator) {
    if (payload.endDate < payload.startDate) {
      throw new E_BAD_REQUEST(
        "Event end date must be on or after the start date"
      );
    }

    return await stripe.api.checkout.sessions.create(
      checkoutSessionParams(payload)
    );
  }
}

/**
 * The Checkout Session an Event Tier purchase pays through.
 *
 * One-time payment, not a subscription (ADR 0001) — an Event Tier buys one Org
 * Event and nothing recurs. Provisioning (issue #88/#90) reads the whole
 * pre-checkout form, buyer included, back off this metadata; a Stripe event on
 * its own supplies none of it.
 *
 * A one-time payment gets no invoice unless asked for, and the buyer needs one
 * to expense the purchase (PRD #84, story 11). With `invoice_creation` on,
 * Stripe emails a paid invoice and its receipt once payment succeeds (the
 * account's "successful payments" emails must be enabled in the Stripe
 * Dashboard). `customer_email` is the email the buyer typed, so Checkout
 * prefills it and the receipt reaches them. It addresses the receipt only:
 * provisioning identifies the buyer by the metadata email, never by the
 * customer or billing details Stripe reports back, which on a corporate card
 * are often the finance department's (ADR 0007, PRD story 17).
 */
export function checkoutSessionParams(
  payload: Validator
): Stripe.Checkout.SessionCreateParams {
  const metadata: CheckoutMetadata = payload;

  return {
    customer_email: payload.email,
    mode: "payment",
    payment_method_types: ["card"],
    ui_mode: "embedded",
    line_items: [
      {
        price: EVENT_TIER_PRICE_IDS[payload.eventTier],
        quantity: 1,
      },
    ],
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: `${capitalize(payload.eventTier)} Event Tier: ${payload.eventName} (${payload.orgName}), ${payload.startDate} to ${payload.endDate}`,
      },
    },
    metadata,
    // Stripe fills in the session id, which the landing page hands to
    // `GET /event-tiers/checkout/:sessionId` to show the buyer their Org.
    return_url: `${env.get("MARKETING_SITE_URL")}/s2s-live?session_id={CHECKOUT_SESSION_ID}`,
  };
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
