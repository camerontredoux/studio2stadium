import type { Transaction } from "#database/service";
import { users } from "#database/schema/users";
import { organizations } from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { and, eq } from "drizzle-orm";

export interface GrantedOrgTier {
  tier: "standard";
  expiresAt: Date;
  /** True when the account already held a tier and only the window moved out. */
  extended: boolean;
}

/**
 * Brings an account's org tier up to what its roster entitles it to.
 *
 * Org accounts get advisory access to the paid experience for a window the org
 * configures (`tierExpiryMonths`), after which they fall back to the plain S2S
 * free tier unless they subscribe. Two things have to hold for that to work:
 *
 *  1. A dancer who already had an S2S account — rather than one created by the
 *     invite flow, which assigns a tier on insert — still gets her window when a
 *     CSV upload or the attach flow links her to a roster row.
 *  2. A dancer who comes back for another event gets her window measured from
 *     the *latest* event she is entitled by, not whichever one happened to
 *     create her account.
 *
 * The window is therefore recomputed on every link and only ever moves outward.
 * This function never shortens an expiry and never downgrades a tier, so it is
 * safe to call on any link, re-upload, or paid-flag change. Explicit revocation
 * stays with `SetRosterPaidService`.
 *
 * Returns what the account ended up with, or null when nothing changed.
 */
export async function grantOrgAccountTier(
  tx: Transaction,
  { userId, orgId }: { userId: string; orgId: string }
): Promise<GrantedOrgTier | null> {
  const [user] = await tx
    .select({
      tier: users.orgAccountTier,
      expiresAt: users.orgAccountTierExpiresAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return null;

  const [org] = await tx
    .select({
      features: organizations.features,
      settings: organizations.settings,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!org) return null;

  const orgFeatures =
    (org.features as Record<string, unknown> | undefined) ?? {};
  const orgSettings =
    (org.settings as Record<string, unknown> | undefined) ?? {};
  const freeTier = Boolean(orgFeatures.freeTierUsers);
  const tierExpiryMonths =
    Number(orgSettings.tierExpiryMonths ?? orgFeatures.tierExpiryMonths) || 3;

  const rosterRows = await tx
    .select({ paid: eventRosters.paid, endDate: orgEvents.endDate })
    .from(eventRosters)
    .innerJoin(orgEvents, eq(orgEvents.id, eventRosters.eventId))
    .where(
      and(
        eq(eventRosters.type, "dancer"),
        eq(eventRosters.userId, userId),
        eq(orgEvents.orgId, orgId)
      )
    );

  // Free-tier orgs sell the upgrade themselves, so only paid rows carry an
  // entitlement there. Measuring the window from entitling rows alone means an
  // unpaid appearance at a later event cannot stretch access someone paid for.
  const entitlingRows = freeTier
    ? rosterRows.filter((r) => r.paid === true)
    : rosterRows;

  // Nothing to grant. Leave the account exactly as it is rather than pushing an
  // unpaid dancer down to 'limited', which would revoke the photo upload a
  // plain free account already has.
  if (entitlingRows.length === 0) return null;

  const latestEnd = entitlingRows
    .map((r) => r.endDate)
    .reduce((a, b) => (a > b ? a : b));

  const earned = new Date(latestEnd);
  earned.setMonth(earned.getMonth() + tierExpiryMonths);

  // Only ever outward: a dancer who already reaches further — a longer window
  // from another event, or one granted when the org's setting was larger —
  // keeps what she has.
  const current = user.expiresAt;
  const expiresAt = current && current > earned ? current : earned;

  const tierChanged = user.tier !== "standard";
  const windowMoved =
    current === null || expiresAt.getTime() !== current.getTime();
  if (!tierChanged && !windowMoved) return null;

  await tx
    .update(users)
    .set({ orgAccountTier: "standard", orgAccountTierExpiresAt: expiresAt })
    .where(eq(users.id, userId));

  return { tier: "standard", expiresAt, extended: user.tier !== null };
}
