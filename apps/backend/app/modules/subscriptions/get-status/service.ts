import { DatabaseService } from "#database/service";
import { premiumGrants } from "#database/schema/organizations";
import { inject } from "@adonisjs/core";
import { and, desc, eq, gt, isNull } from "drizzle-orm";

export type SubscriptionSource = "stripe" | "org_event" | "none";

export interface SubscriptionStatus {
  subscribed: boolean;
  source: SubscriptionSource;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  grantedBy: string | null;
}

@inject()
export class GetSubscriptionService {
  constructor(private db: DatabaseService) {}

  async execute(userId: string): Promise<SubscriptionStatus> {
    const subscription = await this.db.use((db) =>
      db.query.subscriptions.findFirst({
        where: { userId, status: "active" },
      })
    );

    if (subscription) {
      return {
        subscribed: true,
        source: "stripe",
        currentPeriodEnd: subscription.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        grantedBy: null,
      };
    }

    const grant = await this.db.use((db) =>
      db
        .select()
        .from(premiumGrants)
        .where(
          and(
            eq(premiumGrants.userId, userId),
            gt(premiumGrants.expiresAt, new Date()),
            isNull(premiumGrants.revokedAt)
          )
        )
        .orderBy(desc(premiumGrants.expiresAt))
        .limit(1)
        .then((rows) => rows[0])
    );

    if (grant) {
      return {
        subscribed: true,
        source: "org_event",
        currentPeriodEnd: grant.expiresAt,
        cancelAtPeriodEnd: false,
        // Plan 3 will resolve the org slug from grant.sourceId (org_events.id);
        // for now we expose a null placeholder so the API shape is stable.
        grantedBy: null,
      };
    }

    return {
      subscribed: false,
      source: "none",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      grantedBy: null,
    };
  }
}
