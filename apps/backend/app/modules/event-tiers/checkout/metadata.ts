import { type Validator } from "./validator.ts";

/**
 * What a Checkout Session carries about the purchase it is paying for.
 *
 * The buyer is deliberately absent: they travel in `client_reference_id` as a
 * user id, never as a billing email (ADR 0004). Everything else the buyer typed
 * into the pre-checkout form travels in `metadata`, and is all provisioning
 * (issue #88) and the webhook that feeds it (#90) get — a Stripe event on its
 * own says nothing about an Org.
 *
 * Derived from the checkout payload rather than restated, so the shape written
 * onto the session and the shape read back off it cannot drift, and so neither
 * side spells the keys out as strings.
 */
export type CheckoutMetadata = Omit<Validator, "userId">;

/** The metadata half of a validated checkout payload. */
export function toCheckoutMetadata(payload: Validator): CheckoutMetadata {
  const { userId, ...metadata } = payload;

  return metadata;
}
