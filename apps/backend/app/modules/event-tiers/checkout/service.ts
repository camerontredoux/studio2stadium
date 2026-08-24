import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { E_NOT_FOUND } from "#exceptions/not-found";
import stripe from "#payments/stripe/main";
import env from "#start/env";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
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
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1)
    );

    if (!buyer) {
      throw new E_NOT_FOUND("No account exists for that user");
    }

    // One-time payment, not a subscription (ADR 0001) — an Event Tier buys
    // one Org Event and nothing recurs. Provisioning (issue #88/#90) reads
    // client_reference_id and this metadata from the completed session; a
    // Stripe event on its own supplies none of it.
    return await stripe.api.checkout.sessions.create({
      client_reference_id: payload.userId,
      mode: "payment",
      payment_method_types: ["card"],
      ui_mode: "embedded",
      line_items: [
        {
          price: EVENT_TIER_PRICE_IDS[payload.eventTier],
          quantity: 1,
        },
      ],
      metadata: {
        eventTier: payload.eventTier,
        orgName: payload.orgName,
        eventName: payload.eventName,
        startDate: payload.startDate,
        endDate: payload.endDate,
      },
      return_url: `${env.get("MARKETING_SITE_URL")}/s2s-live`,
    });
  }
}
