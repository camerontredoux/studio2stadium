import { db } from "#database/connection";
import { dancerProfiles } from "#database/schema/dancers";
import { premiumRoadmaps, subscriptions } from "#database/schema/subscriptions";
import {
  paidPremium,
  ROADMAP_DAYS,
  ROADMAP_VERSION,
} from "#modules/premium-roadmap/get-roadmap/service";
import { BaseCommand } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import { and, eq, gt, isNull } from "drizzle-orm";

/** Looks up a Stripe subscription's start_date. */
export type FetchStartDate = (subscriptionId: string) => Promise<Date>;

/**
 * Gives Premium members who paid before the roadmap shipped what new members
 * get from the webhook:
 *
 * 1. `user_subscriptions.started_at` from Stripe, for active Stripe
 *    subscriptions that lack it.
 * 2. A `premium_roadmaps` row for dancers still inside their first 30 days.
 *
 * Idempotent: only fills missing values and never overwrites a roadmap.
 */
export async function backfillPremiumRoadmaps(
  fetchStartDate: FetchStartDate,
  now = new Date()
) {
  const missing = await db
    .select({
      id: subscriptions.id,
      subscriptionId: subscriptions.subscriptionId,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.source, "stripe"),
        eq(subscriptions.status, "active"),
        gt(subscriptions.currentPeriodEnd, now),
        isNull(subscriptions.startedAt)
      )
    );

  for (const row of missing) {
    const startedAt = await fetchStartDate(row.subscriptionId);
    await db
      .update(subscriptions)
      .set({ startedAt })
      .where(
        and(eq(subscriptions.id, row.id), isNull(subscriptions.startedAt))
      );
  }

  const windowStart = new Date(now.getTime() - ROADMAP_DAYS * 86_400_000);
  const recent = await db
    .select({
      userId: subscriptions.userId,
      startedAt: subscriptions.startedAt,
    })
    .from(subscriptions)
    .innerJoin(dancerProfiles, eq(dancerProfiles.userId, subscriptions.userId))
    .where(and(paidPremium(now), gt(subscriptions.startedAt, windowStart)));

  const created = recent.length
    ? await db
        .insert(premiumRoadmaps)
        .values(
          recent.map((row) => ({
            userId: row.userId,
            roadmapVersion: ROADMAP_VERSION,
            premiumStartedAt: row.startedAt!,
          }))
        )
        .onConflictDoNothing()
        .returning({ userId: premiumRoadmaps.userId })
    : [];

  return { startedAtSet: missing.length, roadmapsCreated: created.length };
}

export default class BackfillPremiumRoadmaps extends BaseCommand {
  static commandName = "backfill:premium-roadmaps";
  static description =
    "Set Premium start dates from Stripe and create roadmaps for members in their first 30 days";

  static options: CommandOptions = {
    startApp: true,
  };

  // The postgres-js pool isn't closed when the app terminates, and would
  // keep the process alive.
  async completed() {
    await db.$client.end();
  }

  async run() {
    const { default: stripe } = await import("#payments/stripe/main");
    const result = await backfillPremiumRoadmaps(async (subscriptionId) => {
      const subscription =
        await stripe.api.subscriptions.retrieve(subscriptionId);
      return new Date(subscription.start_date * 1000);
    });

    this.logger.success(
      `Set started_at on ${result.startedAtSet} subscriptions; created ${result.roadmapsCreated} roadmaps.`
    );
  }
}
