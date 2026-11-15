import { premiumGrants } from "#database/schema/organizations";
import { subscriptions, weekPasses } from "#database/schema/subscriptions";
import env from "#start/env";
import {
  and,
  eq,
  gt,
  inArray,
  lte,
  or,
  sql,
  type AnyColumn,
  type SQL,
} from "drizzle-orm";

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
/**
 * Programs a Week Pass holder can follow. A Week Pass cannot show interest
 * (push the profile to a program) at all; that needs full Premium.
 */
export const PASS_PROGRAM_LIMIT = 5;

const DAY_MS = 86_400_000;

/**
 * Days a subscription keeps its access after a renewal payment fails, while
 * Stripe retries the card. Stripe moves the subscription into its next
 * billing period before it charges, so the grace runs from the failure, not
 * from the stored period end.
 */
export const PAST_DUE_GRACE_DAYS = 5;

/**
 * Stripe Checkout's shortest trial. Credited Week Pass days become a trial,
 * so a pass with less than this left is credited up to this much.
 */
const MIN_TRIAL_MS = 48 * 60 * 60 * 1000;
// Room for the time between computing the trial end and Stripe checking it.
const TRIAL_MARGIN_MS = 10 * 60 * 1000;

/**
 * When a Week Pass holder who subscribes now is first charged: when their
 * pass runs out, so its unused days are credited toward the new plan.
 */
export function weekPassCreditEndsAt(
  passEndsAt: Date,
  now: Date = new Date()
): Date {
  const earliest = now.getTime() + MIN_TRIAL_MS + TRIAL_MARGIN_MS;
  return new Date(Math.max(passEndsAt.getTime(), earliest));
}

/** Stripe subscription statuses that give access until the period ends. */
const LIVE_STATUSES = ["active", "trialing"] as const;

export interface SubscriptionAccessFields {
  status: string;
  currentPeriodEnd: Date | null;
  pastDueSince: Date | null;
}

/** When a past_due subscription's grace runs out. */
export function pastDueGraceEndsAt(pastDueSince: Date): Date {
  return new Date(pastDueSince.getTime() + PAST_DUE_GRACE_DAYS * DAY_MS);
}

/**
 * When this subscription's access ends, or null when it gives no access now.
 * Active and trialing subscriptions run to their period end; a past_due one
 * runs to the end of its grace.
 */
export function subscriptionAccessEndsAt(
  subscription: SubscriptionAccessFields,
  now: Date = new Date()
): Date | null {
  const endsAt =
    subscription.status === "past_due"
      ? subscription.pastDueSince &&
        pastDueGraceEndsAt(subscription.pastDueSince)
      : (LIVE_STATUSES as readonly string[]).includes(subscription.status)
        ? subscription.currentPeriodEnd
        : null;

  return endsAt && endsAt > now ? endsAt : null;
}

/**
 * The SQL form of `subscriptionAccessEndsAt(...) !== null`, for a query on
 * `user_subscriptions`.
 */
export function subscriptionGivesAccess(now: Date = new Date()): SQL {
  return or(
    and(
      inArray(subscriptions.status, [...LIVE_STATUSES]),
      gt(subscriptions.currentPeriodEnd, now)
    ),
    and(
      eq(subscriptions.status, "past_due"),
      gt(
        subscriptions.pastDueSince,
        new Date(now.getTime() - PAST_DUE_GRACE_DAYS * DAY_MS)
      )
    )
  )!;
}

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
 * A Week Pass giving access now: started and not yet ended. A pass bought
 * while another runs starts when that one ends, so back-to-back passes are
 * never all running at once, and a pass whose predecessor was refunded does
 * not start early.
 */
export function weekPassRunning(now: Date = new Date()): SQL {
  return and(lte(weekPasses.startsAt, now), gt(weekPasses.endsAt, now))!;
}

/**
 * When the Dancer's Week Pass access ends: the end of the pass running now,
 * carried forward through passes that start as it ends. Null when no pass is
 * running.
 */
export function weekPassRunEndsAt(
  passes: { startsAt: Date; endsAt: Date }[],
  now: Date = new Date()
): Date | null {
  const sorted = [...passes].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime()
  );
  let endsAt: Date | null = null;
  for (const pass of sorted) {
    if (endsAt === null) {
      if (pass.startsAt <= now && pass.endsAt > now) endsAt = pass.endsAt;
    } else if (pass.startsAt <= endsAt && pass.endsAt > endsAt) {
      endsAt = pass.endsAt;
    }
  }
  return endsAt;
}

/**
 * True when the user behind `userId` has paid access now: a subscription that
 * gives access (see `subscriptionGivesAccess`), an active premium grant, or a
 * running Week Pass. Coaches see these Dancers as paying members. Uses
 * subqueries rather than joins, so it fits into any query on users.
 */
export function hasPaidAccess(userId: AnyColumn): SQL<boolean> {
  return sql<boolean>`(
    exists (
      select 1 from ${subscriptions}
      where ${subscriptions.userId} = ${userId}
        and ${subscriptionGivesAccess()}
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
        and ${weekPassRunning()}
    )
  )`;
}
