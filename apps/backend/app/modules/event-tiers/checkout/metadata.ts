import { type Validator } from "./validator.ts";

/**
 * What a Checkout Session carries about the purchase it is paying for: the
 * whole pre-checkout form, the buyer's name and email included.
 *
 * Provisioning (issue #88) and the webhook that feeds it (#90) get nothing else
 * — a Stripe event on its own says nothing about an Org, and the buyer is the
 * email they typed here, never the billing email Stripe collects (ADR 0007).
 *
 * The checkout payload itself rather than a restatement of it, so the shape
 * written onto the session and the shape read back off it cannot drift. Both
 * sides validate with the same schema.
 */
export type CheckoutMetadata = Validator;

/** What was bought, without who bought it. */
export type PurchaseDetails = Omit<CheckoutMetadata, "name" | "email">;
