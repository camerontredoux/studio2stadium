import { DatabaseService } from "#database/service";
import { premiumGrants } from "#database/schema/organizations";
import { subscriptions, weekPasses } from "#database/schema/subscriptions";
import {
  subscriptionAccessEndsAt,
  subscriptionPlanFor,
  weekPassCreditEndsAt,
  weekPassRunEndsAt,
  type Access,
  type Plan,
} from "#shared/plans";
import { inject } from "@adonisjs/core";
import { and, desc, eq, gt, isNull } from "drizzle-orm";

export type SubscriptionSource = "stripe" | "week_pass" | "org_event" | "none";

export interface SubscriptionStatus {
  /** Any paid access: a Week Pass or Premium. */
  subscribed: boolean;
  access: Access;
  plan: Plan;
  source: SubscriptionSource;
  /**
   * When access ends or renews: the subscription's billing period end, the
   * grant's expiry, or the end of the last Week Pass bought.
   */
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  grantedBy: string | null;
  /**
   * A renewal payment failed and Stripe is retrying the card. While the
   * grace period runs, access continues and `currentPeriodEnd` is when it
   * ends; after that the Dancer has lost access but still needs to update
   * the card from the billing portal.
   */
  paymentFailed: boolean;
  /**
   * For a Week Pass holder, when a Monthly, Season Pass or Annual plan bought
   * now would first charge: the pass's unused days are credited toward it.
   * Null for everyone else.
   */
  upgradeFirstChargeAt: Date | null;
}

/**
 * The Dancer's plan right now. Premium wins over a Week Pass running
 * alongside it, and a subscription wins over a premium grant.
 */
@inject()
export class GetSubscriptionService {
  constructor(private db: DatabaseService) {}

  async execute(userId: string): Promise<SubscriptionStatus> {
    const now = new Date();

    const [subscription, grant, passes] = await Promise.all([
      this.db.use((db) =>
        db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, userId))
          .limit(1)
          .then((rows) => rows[0])
      ),
      this.db.use((db) =>
        db
          .select()
          .from(premiumGrants)
          .where(
            and(
              eq(premiumGrants.userId, userId),
              gt(premiumGrants.expiresAt, now),
              isNull(premiumGrants.revokedAt)
            )
          )
          .orderBy(desc(premiumGrants.expiresAt))
          .limit(1)
          .then((rows) => rows[0])
      ),
      this.db.use((db) =>
        db
          .select({ startsAt: weekPasses.startsAt, endsAt: weekPasses.endsAt })
          .from(weekPasses)
          .where(and(eq(weekPasses.userId, userId), gt(weekPasses.endsAt, now)))
      ),
    ]);
    const passEndsAt = weekPassRunEndsAt(passes, now);

    const paymentFailed = subscription?.status === "past_due";
    const subscriptionEndsAt =
      subscription && subscriptionAccessEndsAt(subscription, now);

    if (subscription && subscriptionEndsAt) {
      return {
        subscribed: true,
        access: "premium",
        plan: subscriptionPlanFor(subscription.priceId) ?? "premium",
        source: "stripe",
        currentPeriodEnd: subscriptionEndsAt,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        grantedBy: null,
        paymentFailed,
        upgradeFirstChargeAt: null,
      };
    }

    if (grant) {
      return {
        subscribed: true,
        access: "premium",
        plan: "premium",
        source: "org_event",
        currentPeriodEnd: grant.expiresAt,
        cancelAtPeriodEnd: false,
        // Plan 3 will resolve the org slug from grant.sourceId (org_events.id);
        // for now we expose a null placeholder so the API shape is stable.
        grantedBy: null,
        paymentFailed,
        upgradeFirstChargeAt: null,
      };
    }

    if (passEndsAt) {
      return {
        subscribed: true,
        access: "pass",
        plan: "week_pass",
        source: "week_pass",
        currentPeriodEnd: passEndsAt,
        // A pass never renews.
        cancelAtPeriodEnd: true,
        grantedBy: null,
        paymentFailed,
        upgradeFirstChargeAt: weekPassCreditEndsAt(passEndsAt, now),
      };
    }

    return {
      subscribed: false,
      access: "free",
      plan: "free",
      source: "none",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      grantedBy: null,
      paymentFailed,
      upgradeFirstChargeAt: null,
    };
  }
}
