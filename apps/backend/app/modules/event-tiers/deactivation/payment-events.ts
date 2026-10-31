import { paymentIntentIdOf } from "../provisioning/checkout-session.ts";
import { type DeactivateInput } from "./service.ts";

/**
 * The fields of a refunded Charge that deactivation reads, named as Stripe names
 * them so the webhook can hand the charge over as it is. Structural rather than
 * `Stripe.Charge`, so the rule is tested with plain values.
 */
export interface RefundedCharge {
  id: string;
  /** True only once the whole amount has been refunded. */
  refunded: boolean;
  payment_intent: string | { id: string } | null;
}

/** The fields of a Dispute that deactivation reads. */
export interface OpenedDispute {
  id: string;
  payment_intent: string | { id: string } | null;
}

/**
 * Read a `charge.refunded` event as a deactivation, or `null` when it is not
 * one.
 *
 * Only a full refund stands the event down. Stripe sends the same event for
 * every partial refund, and a partial refund is a concession — staff settling a
 * complaint while the event goes ahead — not the purchase being taken back.
 */
export function refundToDeactivation(
  charge: RefundedCharge
): DeactivateInput | null {
  if (!charge.refunded) return null;

  const paymentIntentId = paymentIntentIdOf(charge.payment_intent);
  if (!paymentIntentId) return null;

  return { paymentIntentId, reason: "refunded", providerReference: charge.id };
}

/**
 * Read a `charge.dispute.created` event as a deactivation. A dispute stands the
 * event down as soon as it opens: the money is already held by the bank, and
 * how it ends is for staff to work out with the customer (ADR 0005).
 */
export function disputeToDeactivation(
  dispute: OpenedDispute
): DeactivateInput | null {
  const paymentIntentId = paymentIntentIdOf(dispute.payment_intent);
  if (!paymentIntentId) return null;

  return {
    paymentIntentId,
    reason: "disputed",
    providerReference: dispute.id,
  };
}
