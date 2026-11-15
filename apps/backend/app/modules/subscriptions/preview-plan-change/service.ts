import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { renewalTerms } from "#modules/subscriptions/create-checkout/disclosure";
import {
  findSwitch,
  PRORATION,
} from "#modules/subscriptions/change-plan/switchable";
import stripe from "#payments/stripe/main";
import { type SubscriptionPlan } from "#shared/plans";
import { inject } from "@adonisjs/core";
import { type Stripe } from "stripe";

export interface PlanChangePreview {
  plan: SubscriptionPlan;
  /** Charged to the card on file when the member confirms, in cents. */
  amountDue: number;
  /**
   * The part of today's price paid from credit already on the member's
   * balance, such as from an earlier switch to a cheaper plan, in cents.
   */
  paidFromCredit: number;
  /**
   * Unused time on the current plan beyond the new plan's price, in cents.
   * Stripe keeps it on the member's balance and takes it off later invoices.
   */
  credit: number;
  currency: string;
  /** When the new plan first renews. */
  renewsAt: Date;
  /** What each renewal costs, in cents. */
  renewalAmount: number;
  /** "Renews automatically at $69.00 every 3 months until you cancel in Membership settings." */
  terms: string;
  /** The subscription is set to cancel, and switching keeps it instead. */
  clearsCancellation: boolean;
  /**
   * The moment the amounts are worked out from, in Unix seconds. Confirming
   * sends it back, so the charge is the amount shown.
   */
  prorationDate: number;
}

/**
 * What switching the member's subscription to `plan` costs now and later,
 * from Stripe's preview of the invoice the switch creates.
 */
@inject()
export class PreviewPlanChangeService {
  constructor(private db: DatabaseService) {}

  async execute(
    userId: string,
    plan: SubscriptionPlan
  ): Promise<PlanChangePreview> {
    const { subscription, item, price, alreadyOnPlan, pendingCancellation } =
      await findSwitch(this.db, userId, plan);

    if (alreadyOnPlan) {
      throw new E_BAD_REQUEST("You're already on this plan.");
    }

    const prorationDate = Math.floor(Date.now() / 1000);

    const [invoice, stripePrice] = await Promise.all([
      stripe.api.invoices.createPreview({
        subscription: subscription.id,
        subscription_details: {
          items: [{ id: item.id, price }],
          proration_behavior: PRORATION,
          proration_date: prorationDate,
          ...(pendingCancellation && { cancel_at_period_end: false }),
        },
      }),
      stripe.api.prices.retrieve(price),
    ]);

    const renewal = newPlanLine(invoice, price);

    return {
      plan,
      amountDue: invoice.amount_due,
      paidFromCredit: Math.max(0, invoice.total - invoice.amount_due),
      credit: Math.max(0, -invoice.total),
      currency: invoice.currency,
      renewsAt: new Date(
        (subscription.status === "trialing" && subscription.trial_end
          ? subscription.trial_end
          : (renewal?.period.end ?? item.current_period_end)) * 1000
      ),
      renewalAmount: renewal
        ? renewal.amount -
          (renewal.discount_amounts ?? []).reduce((sum, d) => sum + d.amount, 0)
        : (stripePrice.unit_amount ?? 0),
      terms: renewalTerms(stripePrice),
      clearsCancellation: pendingCancellation,
      prorationDate,
    };
  }
}

/**
 * The invoice line that bills the new plan's first full period, not a
 * proration. A switch between plans with different billing periods starts a
 * new period now, so this line's period ends at the first renewal.
 */
function newPlanLine(invoice: Stripe.Invoice, price: string) {
  return invoice.lines.data.find((line) => {
    const details = line.parent?.subscription_item_details;
    const linePrice = line.pricing?.price_details?.price;
    const linePriceId =
      typeof linePrice === "string" ? linePrice : linePrice?.id;
    return details && !details.proration && linePriceId === price;
  });
}
