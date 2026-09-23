import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { E_NOT_FOUND } from "#exceptions/not-found";
import stripe from "#payments/stripe/main";
import env from "#start/env";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type Stripe } from "stripe";
import { toCheckoutMetadata } from "./metadata.ts";
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

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(payload: Validator) {
    if (payload.endDate < payload.startDate) {
      throw new E_BAD_REQUEST(
        "Event end date must be on or after the start date"
      );
    }

    const [buyer] = await this.db.use((db) =>
      db
        .select({ id: users.id, email: users.displayEmail })
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1)
    );

    if (!buyer) {
      throw new E_NOT_FOUND("No account exists for that user");
    }

    return await stripe.api.checkout.sessions.create(
      checkoutSessionParams(payload, buyer)
    );
  }
}

/**
 * The Checkout Session an Event Tier purchase pays through.
 *
 * One-time payment, not a subscription (ADR 0001) — an Event Tier buys one Org
 * Event and nothing recurs. Provisioning (issue #88/#90) reads
 * client_reference_id and this metadata from the completed session; a Stripe
 * event on its own supplies none of it.
 *
 * A one-time payment gets no invoice unless asked for, and the buyer needs one
 * to expense the purchase (PRD #84, story 11). With `invoice_creation` on,
 * Stripe emails a paid invoice and its receipt once payment succeeds (the
 * account's "successful payments" emails must be enabled in the Stripe
 * Dashboard). The email is the buyer's account address, the same one the
 * membership checkout uses, so the receipt reaches the Organizer who bought the
 * event. It only addresses the receipt: provisioning still identifies the buyer
 * by `client_reference_id`, never by email (ADR 0004).
 */
export function checkoutSessionParams(
  payload: Validator,
  buyer: { id: string; email: string }
): Stripe.Checkout.SessionCreateParams {
  return {
    client_reference_id: buyer.id,
    customer_email: buyer.email,
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
    metadata: toCheckoutMetadata(payload),
    // Stripe fills in the session id, which the landing page hands to
    // `GET /event-tiers/checkout/:sessionId` to show the buyer their Org.
    return_url: `${env.get("MARKETING_SITE_URL")}/s2s-live?session_id={CHECKOUT_SESSION_ID}`,
  };
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
