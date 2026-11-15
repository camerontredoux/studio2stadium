import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import {
  GetSubscriptionService,
  type SubscriptionStatus,
} from "#modules/subscriptions/get-status/service";
import { SyncSubscriptionService } from "#modules/subscriptions/sync-subscription/service";
import stripe from "#payments/stripe/main";
import { inject } from "@adonisjs/core";
import logger from "@adonisjs/core/services/logger";
import { sql } from "drizzle-orm";
import Stripe from "stripe";
import { findSwitch, PRORATION } from "./switchable.ts";
import { type Validator } from "./validator.ts";

/**
 * How long a preview's amounts stay good to confirm. Proration moves by the
 * second, so a confirm long after the preview would charge another amount.
 */
const PREVIEW_TTL_SECONDS = 30 * 60;
// Room for the server clocks of the preview and the confirm to differ.
const CLOCK_SKEW_SECONDS = 60;

export interface PlanChangeResult {
  status: SubscriptionStatus;
  /** Charged to the card for the switch, in cents. */
  amountPaid: number;
  /** Added to the member's Stripe balance for later invoices, in cents. */
  credit: number;
  currency: string;
}

/**
 * Switch the member's own Stripe subscription to another plan in place, so
 * their access never lapses. The switch is billed at once (see
 * `PRORATION`), and a subscription set to cancel stays on instead.
 *
 * A declined card changes nothing: Stripe holds the switch as a pending
 * update until the invoice is paid, and voiding that invoice drops it.
 *
 * Safe to submit twice. The user's lock serializes switches, and a switch to
 * the plan the subscription is already on only syncs it; Stripe's idempotency
 * key covers a retried request.
 */
@inject()
export class ChangePlanService {
  constructor(
    private db: DatabaseService,
    private sync: SyncSubscriptionService,
    private status: GetSubscriptionService
  ) {}

  async execute(
    userId: string,
    { plan, prorationDate }: Validator
  ): Promise<PlanChangeResult> {
    const now = Math.floor(Date.now() / 1000);
    if (
      prorationDate < now - PREVIEW_TTL_SECONDS ||
      prorationDate > now + CLOCK_SKEW_SECONDS
    ) {
      throw new E_BAD_REQUEST(
        "The price shown has expired. Review the change again."
      );
    }

    const invoice = await this.db.tx(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`change-plan:${userId}`}))`
      );

      const { subscription, item, price, alreadyOnPlan, pendingCancellation } =
        await findSwitch(this.db, userId, plan);

      if (alreadyOnPlan) {
        // A repeat of a switch that went through. Clear a cancellation the
        // first request left, then sync.
        const current = pendingCancellation
          ? await stripe.api.subscriptions.update(subscription.id, {
              cancel_at_period_end: false,
            })
          : subscription;
        await this.sync.execute(current, new Date());
        return null;
      }

      const updated = await stripe.api.subscriptions
        .update(
          subscription.id,
          {
            items: [{ id: item.id, price }],
            proration_behavior: PRORATION,
            proration_date: prorationDate,
            payment_behavior: "pending_if_incomplete",
            // Also clears a `cancel_at` date; `cancel_at` itself is not
            // allowed in a pending update.
            ...(pendingCancellation && { cancel_at_period_end: false }),
            expand: ["latest_invoice"],
          },
          {
            idempotencyKey: `change-plan:${subscription.id}:${price}:${prorationDate}`,
          }
        )
        .catch((error: unknown) => {
          logger.error(
            { err: error, userId, subscriptionId: subscription.id, plan },
            "Plan change failed in Stripe"
          );
          throw new E_BAD_REQUEST(
            "We couldn't change your plan. Please try again, or use Manage billing."
          );
        });

      const latest = updated.latest_invoice as Stripe.Invoice | null;

      if (updated.pending_update) {
        // A resubmit gets Stripe's saved reply to the first request, whose
        // invoice that request already voided.
        if (latest?.status === "open") {
          await stripe.api.invoices
            .voidInvoice(latest.id!)
            .catch((error: unknown) => {
              if (!(error instanceof Stripe.errors.StripeInvalidRequestError)) {
                throw error;
              }
              logger.warn(
                { err: error, userId, invoiceId: latest.id },
                "Declined plan change invoice not voided"
              );
            });
        }
        throw new E_BAD_REQUEST(
          "Your card was declined, so your plan didn't change. Update your card from Manage billing, then try again."
        );
      }

      await this.sync.execute(updated, new Date());

      logger.info(
        {
          userId,
          subscriptionId: updated.id,
          plan,
          invoiceId: latest?.id,
          amountPaid: latest?.amount_paid,
          total: latest?.total,
        },
        "Subscription plan changed"
      );

      return latest;
    });

    return {
      status: await this.status.execute(userId),
      amountPaid: invoice?.amount_paid ?? 0,
      credit: invoice ? Math.max(0, -invoice.total) : 0,
      currency: invoice?.currency ?? "usd",
    };
  }
}
