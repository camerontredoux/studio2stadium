import { schema as checkoutSchema } from "../checkout/validator.ts";
import { type ProvisionInput } from "./service.ts";

/**
 * The fields of a completed Checkout Session that provisioning reads, named as
 * Stripe names them so the webhook can hand its session over as it is. Declared
 * structurally rather than as `Stripe.Checkout.Session` so what makes a
 * purchase provisionable is tested with plain values instead of a Stripe double.
 */
export interface CompletedCheckoutSession {
  id: string;
  payment_status: string;
  metadata: Record<string, string> | null;
  /** An id, or the expanded PaymentIntent when a caller asked for one. */
  payment_intent: string | { id: string } | null;
  /** The total charged, in the currency's minor unit (cents). */
  amount_total: number | null;
  currency: string | null;
}

/**
 * A completed Event Tier session that cannot be turned into a customer. Thrown,
 * never swallowed: somebody has paid, so the webhook answers with an error for
 * Stripe to retry and show as a failed delivery, and the failure is reported.
 */
export class UnprovisionableCheckoutError extends Error {
  constructor(
    readonly sessionId: string,
    reason: string,
    options: ErrorOptions = {}
  ) {
    super(
      `Checkout Session ${sessionId} cannot be provisioned: ${reason}`,
      options
    );
    this.name = "UnprovisionableCheckoutError";
  }
}

/**
 * Read a completed one-time Checkout Session as the purchase it paid for.
 *
 * The inverse of what `checkout/service.ts` writes onto the session: the whole
 * pre-checkout form from `metadata`, re-validated because it is the only record
 * of what the buyer asked for. The buyer is the name and email they typed there
 * — never the customer or billing email Stripe reports, which on a corporate
 * card is often the finance department's (ADR 0007, PRD story 17). The session
 * id is the purchase reference, which is what makes a redelivered webhook
 * provision once.
 */
export async function toProvisionInput(
  session: CompletedCheckoutSession
): Promise<ProvisionInput> {
  // Card-only sessions complete paid. Anything else has not been paid for yet,
  // and provisioning it would hand over an event nobody paid for.
  if (session.payment_status !== "paid") {
    throw new UnprovisionableCheckoutError(
      session.id,
      `payment status is "${session.payment_status}"`
    );
  }

  const [error, metadata] = await checkoutSchema.tryValidate(
    session.metadata ?? {}
  );

  if (error) {
    throw new UnprovisionableCheckoutError(
      session.id,
      "its buyer or purchase metadata is missing or invalid",
      { cause: error }
    );
  }

  const { name, email, ...purchase } = metadata;

  return {
    reference: session.id,
    buyer: { name, email },
    purchase,
    paymentIntentId: paymentIntentIdOf(session.payment_intent),
    amountTotal: session.amount_total,
    currency: session.currency,
  };
}

/** A Stripe expandable PaymentIntent field, reduced to its id. */
export function paymentIntentIdOf(
  paymentIntent: string | { id: string } | null
): string | null {
  if (paymentIntent === null) return null;
  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}
