import { premiumGrants } from "#database/schema/organizations";
import { subscriptions, weekPasses } from "#database/schema/subscriptions";
import env from "#start/env";
import { sql, type AnyColumn, type SQL } from "drizzle-orm";

/**
 * The plans a Dancer can buy. The 1-Week Pass is a one-time payment for seven
 * days of limited access; Monthly, the 3-Month Season Pass and Annual are
 * subscriptions to full Premium. Coaches are always free.
 */
export const PAID_PLANS = [
  "week_pass",
  "monthly",
  "season_pass",
  "annual",
] as const;

export type PaidPlan = (typeof PAID_PLANS)[number];
export type SubscriptionPlan = Exclude<PaidPlan, "week_pass">;

/**
 * The plan a Dancer is on now. "premium" is full access without a plan of its
 * own: a premium grant, or a subscription to a Stripe Price no plan names.
 */
export type Plan = "free" | PaidPlan | "premium";

/**
 * What the plan unlocks. "pass" is the Week Pass: most features, with the
 * limits below and no Common Recruit submissions.
 */
export type Access = "free" | "pass" | "premium";

export const WEEK_PASS_DAYS = 7;
export const PASS_PHOTO_LIMIT = 4;
export const PASS_VIDEO_LIMIT = 3;
/** Programs a Week Pass holder can follow, and push their profile to. */
export const PASS_PROGRAM_LIMIT = 5;

/**
 * The Stripe Price for a plan in this environment. The Week Pass and Season
 * Pass prices are optional settings, so a plan without one cannot be bought.
 * Annual keeps the older `STRIPE_PRICE_ID_YEARLY` name.
 */
export function priceIdFor(plan: PaidPlan): string | undefined {
  switch (plan) {
    case "week_pass":
      return env.get("STRIPE_PRICE_ID_WEEK_PASS");
    case "monthly":
      return env.get("STRIPE_PRICE_ID_MONTHLY");
    case "season_pass":
      return env.get("STRIPE_PRICE_ID_SEASON_PASS");
    case "annual":
      return env.get("STRIPE_PRICE_ID_YEARLY");
  }
}

export function subscriptionPlanFor(
  priceId: string | null
): SubscriptionPlan | null {
  if (!priceId) return null;
  const plans: SubscriptionPlan[] = ["monthly", "season_pass", "annual"];
  return plans.find((plan) => priceIdFor(plan) === priceId) ?? null;
}

/**
 * True when the user behind `userId` has paid access now: an active
 * subscription, an active premium grant, or a running Week Pass. Coaches see
 * these Dancers as paying members. Uses subqueries rather than joins, so it
 * fits into any query on users.
 */
export function hasPaidAccess(userId: AnyColumn): SQL<boolean> {
  return sql<boolean>`(
    exists (
      select 1 from ${subscriptions}
      where ${subscriptions.userId} = ${userId}
        and ${subscriptions.status} = 'active'
        and ${subscriptions.currentPeriodEnd} > now()
    )
    or exists (
      select 1 from ${premiumGrants}
      where ${premiumGrants.userId} = ${userId}
        and ${premiumGrants.expiresAt} > now()
        and ${premiumGrants.revokedAt} is null
    )
    or exists (
      select 1 from ${weekPasses}
      where ${weekPasses.userId} = ${userId}
        and ${weekPasses.endsAt} > now()
    )
  )`;
}
