import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { orgEvents } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import env from "#start/env";
import { inject } from "@adonisjs/core";
import logger from "@adonisjs/core/services/logger";
import * as Sentry from "@sentry/node";
import { eq } from "drizzle-orm";
import { PurchaseDeactivatedEvent } from "./event.ts";

/** Why the payment provider took the money back. */
export type DeactivationReason =
  (typeof eventTierPurchases.$inferSelect)["deactivationReason"] & {};

/**
 * A refund or dispute against a payment, as the webhook reads it. No Stripe
 * types here, for the same reason as provisioning: what a refund does to a
 * purchase is tested with plain values, never a faked payment provider.
 */
export interface DeactivateInput {
  /** The payment that was refunded or disputed — a Stripe PaymentIntent id. */
  paymentIntentId: string;
  reason: DeactivationReason;
  /** The refunded charge or the dispute, for staff to find in Stripe. */
  providerReference: string;
}

export type DeactivateResult =
  /** The purchase's Org Event was stood down just now, and staff were told. */
  | {
      outcome: "deactivated";
      purchase: typeof eventTierPurchases.$inferSelect;
      event: typeof orgEvents.$inferSelect;
    }
  /**
   * An earlier refund or dispute already stood it down — a redelivered
   * webhook, or a dispute on a refunded payment. Nothing was changed.
   */
  | {
      outcome: "already_deactivated";
      purchase: typeof eventTierPurchases.$inferSelect;
    }
  /**
   * The payment bought no Org Event — a Dancer's subscription payment, which
   * Stripe reports through the same refund and dispute events.
   */
  | { outcome: "not_an_event_tier_purchase" };

/**
 * Stand a refunded or disputed Org Event down, and raise a hand (ADR 0005).
 *
 * The Org Event is set inactive and the purchase record says why and when.
 * Nothing else is touched: by the time a refund or chargeback lands, the Org may
 * have a roster of real Dancers with Coaches' notes, ratings and callbacks
 * against them, and Dancers may hold an Account Tier the event granted them.
 * Tearing any of that down would break a live audition over a dispute the
 * Dancers are not party to, so resolving it is left to a person, in Stripe and
 * the admin dashboard — this service's job is to stop the event and tell staff.
 *
 * Deactivating the active event leaves the Org with none. Another event is
 * deliberately not promoted in its place (as deleting one does): the Org is in
 * a dispute, and what runs next is for staff and the Organizer to decide.
 */
@inject()
export class DeactivatePurchaseService {
  constructor(private db: DatabaseService) {}

  async execute(input: DeactivateInput): Promise<DeactivateResult> {
    const result = await this.db.tx(async (tx) => {
      // Locked so a refund and a dispute delivered together stand the event
      // down, and notify staff, exactly once between them.
      const [purchase] = await tx
        .select()
        .from(eventTierPurchases)
        .where(eq(eventTierPurchases.paymentIntentId, input.paymentIntentId))
        .limit(1)
        .for("update");

      if (!purchase) return { outcome: "not_an_event_tier_purchase" } as const;

      if (purchase.deactivatedAt) {
        return { outcome: "already_deactivated", purchase } as const;
      }

      const [before] = await tx
        .select({ isActive: orgEvents.isActive })
        .from(orgEvents)
        .where(eq(orgEvents.id, purchase.eventId))
        .limit(1);

      const [event] = await tx
        .update(orgEvents)
        .set({ isActive: false })
        .where(eq(orgEvents.id, purchase.eventId))
        .returning();

      const [deactivated] = await tx
        .update(eventTierPurchases)
        .set({
          deactivatedAt: new Date(),
          deactivationReason: input.reason,
          deactivationReference: input.providerReference,
        })
        .where(eq(eventTierPurchases.id, purchase.id))
        .returning();

      return {
        outcome: "deactivated",
        purchase: deactivated!,
        event: event!,
        wasActive: before?.isActive ?? false,
      } as const;
    });

    if (result.outcome !== "deactivated") return result;

    await this.notifyStaff(result.purchase, result.event, result.wasActive);

    return {
      outcome: result.outcome,
      purchase: result.purchase,
      event: result.event,
    };
  }

  /**
   * Tell the Studio 2 Stadium team. After the commit, so staff never hear
   * about a deactivation that rolled back, and never fatal: the event is
   * already stood down, and failing the webhook now would only make Stripe
   * redeliver an event that finds nothing left to do.
   */
  private async notifyStaff(
    purchase: typeof eventTierPurchases.$inferSelect,
    event: typeof orgEvents.$inferSelect,
    wasActive: boolean
  ) {
    try {
      const [row] = await this.db.use((db) =>
        db
          .select({
            orgName: organizations.name,
            orgSlug: organizations.slug,
            buyerFirstName: users.firstName,
            buyerLastName: users.lastName,
            buyerEmail: users.displayEmail,
          })
          .from(organizations)
          .innerJoin(users, eq(users.id, purchase.buyerId))
          .where(eq(organizations.id, event.orgId))
          .limit(1)
      );

      await PurchaseDeactivatedEvent.dispatch({
        reason: purchase.deactivationReason!,
        orgName: row?.orgName ?? "Unknown Org",
        orgAdminUrl: `${env.get("SITE_URL")}/o/${row?.orgSlug ?? ""}/admin`,
        eventName: event.name,
        eventTier: event.eventTier,
        wasActive,
        buyerName: row
          ? `${row.buyerFirstName} ${row.buyerLastName}`.trim()
          : "Unknown buyer",
        buyerEmail: row?.buyerEmail ?? "unknown",
        checkoutSessionId: purchase.reference,
        paymentIntentId: purchase.paymentIntentId ?? "unknown",
        providerReference: purchase.deactivationReference ?? "unknown",
      });
    } catch (error) {
      logger.error(
        { err: error, purchaseId: purchase.id, eventId: event.id },
        "Failed to notify staff of a deactivated Event Tier purchase"
      );
      Sentry.captureException(error, {
        extra: { purchaseId: purchase.id, eventId: event.id },
      });
    }
  }
}
