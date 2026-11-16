import { db } from "#database/connection";
import { premiumGrants } from "#database/schema/organizations";
import { subscriptions, weekPasses } from "#database/schema/subscriptions";
import { users } from "#database/schema/users";
import {
  emailSuppressions,
  type WeekPassEmailKind,
} from "#database/schema/week-pass-emails";
import { subscriptionAccessEndsAt } from "#shared/plans";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import type { WeekPassEmailConfig } from "./config.ts";
import { runContaining, welcomeVariant, type PassTimes } from "./schedule.ts";

/** An expired-pass offer more than this late is dropped, not sent. */
export const EXPIRED_STALE_MS = 3 * 86_400_000;

export type SuppressReason =
  | "user_missing"
  | "no_email"
  | "opted_out"
  | "suppression_list"
  | "pass_missing"
  | "refunded_or_disputed"
  | "before_activation"
  | "pass_ended"
  | "still_has_pass_access"
  | "run_changed"
  | "stale"
  | "subscription_access"
  | "upgraded"
  | "premium_grant";

export interface Recipient {
  userId: string;
  email: string;
  firstName: string | null;
  username: string;
}

export type WelcomeDecision =
  | { send: false; reason: SuppressReason }
  | {
      send: true;
      recipient: Recipient;
      variant: "current" | "queued";
      startsAt: Date;
      accessEndsAt: Date;
    };

export type ExpiredDecision =
  | { send: false; reason: SuppressReason }
  | { send: true; recipient: Recipient };

export interface EmailRow {
  kind: WeekPassEmailKind;
  userId: string;
  weekPassId: string;
  accessEndsAt: Date | null;
}

async function loadRecipient(
  userId: string
): Promise<{ recipient: Recipient } | { reason: SuppressReason }> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      displayEmail: users.displayEmail,
      firstName: users.firstName,
      username: users.username,
      notifications: users.notifications,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return { reason: "user_missing" };
  const email = user.displayEmail?.trim();
  if (!email) return { reason: "no_email" };
  if (!user.notifications) return { reason: "opted_out" };

  const addresses = [...new Set([email, user.email].filter(Boolean))];
  const [suppressed] = await db
    .select({ email: emailSuppressions.email })
    .from(emailSuppressions)
    .where(inArray(emailSuppressions.email, addresses))
    .limit(1);
  if (suppressed) return { reason: "suppression_list" };

  return {
    recipient: {
      userId: user.id,
      email,
      firstName: user.firstName?.trim() || null,
      username: user.username,
    },
  };
}

async function loadPasses(userId: string): Promise<PassTimes[]> {
  return await db
    .select({
      id: weekPasses.id,
      startsAt: weekPasses.startsAt,
      endsAt: weekPasses.endsAt,
      createdAt: weekPasses.createdAt,
      revokedAt: weekPasses.revokedAt,
    })
    .from(weekPasses)
    .where(eq(weekPasses.userId, userId));
}

/**
 * Whether a welcome still makes sense: the pass is paid and not refunded,
 * its access has not already run out, and the Dancer can be emailed.
 */
export async function decideWelcome(
  row: EmailRow,
  config: WeekPassEmailConfig,
  now: Date
): Promise<WelcomeDecision> {
  const loaded = await loadRecipient(row.userId);
  if ("reason" in loaded) return { send: false, reason: loaded.reason };

  const passes = await loadPasses(row.userId);
  const pass = passes.find((p) => p.id === row.weekPassId);
  if (!pass) return { send: false, reason: "pass_missing" };
  if (pass.revokedAt) return { send: false, reason: "refunded_or_disputed" };
  if (!config.activeFrom || pass.createdAt < config.activeFrom) {
    return { send: false, reason: "before_activation" };
  }

  const run = runContaining(passes, pass.id)!;
  if (run.endsAt <= now) return { send: false, reason: "pass_ended" };

  return {
    send: true,
    recipient: loaded.recipient,
    variant: welcomeVariant(pass),
    startsAt: pass.startsAt,
    // The end of continuous access, not this pass alone: later passes
    // stacked behind it extend what the Dancer actually has.
    accessEndsAt: run.endsAt,
  };
}

/**
 * Whether the Dancer should still get the Premium offer for the run that
 * ended at `row.accessEndsAt`. Any sign they already have, or bought, more
 * access suppresses it, as does any refund or dispute touching the run.
 */
export async function decideExpired(
  row: EmailRow,
  config: WeekPassEmailConfig,
  now: Date
): Promise<ExpiredDecision> {
  const passes = await loadPasses(row.userId);
  const run = runContaining(passes, row.weekPassId);
  if (!run) return { send: false, reason: "pass_missing" };

  if (passes.some((p) => p.endsAt > now)) {
    return { send: false, reason: "still_has_pass_access" };
  }
  if (
    !row.accessEndsAt ||
    run.endsAt.getTime() !== row.accessEndsAt.getTime()
  ) {
    return { send: false, reason: "run_changed" };
  }
  if (
    run.passes.some((p) => p.revokedAt) ||
    passes.some((p) => p.revokedAt && p.startsAt >= run.startsAt)
  ) {
    return { send: false, reason: "refunded_or_disputed" };
  }
  if (!config.activeFrom || run.endsAt < config.activeFrom) {
    return { send: false, reason: "before_activation" };
  }
  if (now.getTime() - run.endsAt.getTime() > EXPIRED_STALE_MS) {
    return { send: false, reason: "stale" };
  }

  const [subscription] = await db
    .select({
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      pastDueSince: subscriptions.pastDueSince,
      startedAt: subscriptions.startedAt,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, row.userId));
  if (subscription) {
    // Active, trialing, or past_due inside its payment-failure grace.
    if (subscriptionAccessEndsAt(subscription, now)) {
      return { send: false, reason: "subscription_access" };
    }
    if (subscription.startedAt && subscription.startedAt >= run.startsAt) {
      return { send: false, reason: "upgraded" };
    }
  }

  const [grant] = await db
    .select({ id: premiumGrants.id })
    .from(premiumGrants)
    .where(
      and(
        eq(premiumGrants.userId, row.userId),
        gt(premiumGrants.expiresAt, now),
        isNull(premiumGrants.revokedAt)
      )
    )
    .limit(1);
  if (grant) return { send: false, reason: "premium_grant" };

  const loaded = await loadRecipient(row.userId);
  if ("reason" in loaded) return { send: false, reason: loaded.reason };

  return { send: true, recipient: loaded.recipient };
}
