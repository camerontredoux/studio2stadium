import { DatabaseService } from "#database/service";
import { premiumGrants } from "#database/schema/organizations";
import { subscriptions, weekPasses } from "#database/schema/subscriptions";
import { subscriptionPlanFor, type Access, type Plan } from "#shared/plans";
import { inject } from "@adonisjs/core";
import { and, desc, eq, gt, isNull, max } from "drizzle-orm";

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

    const [subscription, grant, pass] = await Promise.all([
      this.db.use((db) =>
        db
          .select()
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.userId, userId),
              eq(subscriptions.status, "active"),
              gt(subscriptions.currentPeriodEnd, now)
            )
          )
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
          .select({ endsAt: max(weekPasses.endsAt) })
          .from(weekPasses)
          .where(and(eq(weekPasses.userId, userId), gt(weekPasses.endsAt, now)))
          .then((rows) => rows[0])
      ),
    ]);

    if (subscription) {
      return {
        subscribed: true,
        access: "premium",
        plan: subscriptionPlanFor(subscription.priceId) ?? "premium",
        source: "stripe",
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        grantedBy: null,
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
      };
    }

    if (pass?.endsAt) {
      return {
        subscribed: true,
        access: "pass",
        plan: "week_pass",
        source: "week_pass",
        currentPeriodEnd: pass.endsAt,
        // A pass never renews.
        cancelAtPeriodEnd: true,
        grantedBy: null,
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
    };
  }
}
