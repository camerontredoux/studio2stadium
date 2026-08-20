import type { Transaction } from "#database/service";
import { users } from "#database/schema/users";
import { organizations } from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { and, eq, isNull } from "drizzle-orm";

/**
 * Gives a pre-existing account the org tier its roster entitles it to.
 *
 * `RegisterDancerService` assigns a tier when it *creates* an account from an
 * invite. A dancer who already had an S2S account — or who made one outside the
 * invite link — instead gets joined to a roster row by the CSV upload or the
 * attach flow, and those paths used to leave `org_account_tier` NULL.
 *
 * NULL is the plain free tier: no direct video, *no YouTube video*, 4 photos.
 * So a paid dancer who happened to already have an account ended up with
 * strictly less access than the unpaid 'limited' dancers beside her on the same
 * roster, and the video dialog told her to buy premium she had already paid for.
 *
 * This only ever grants. It never downgrades: an account that already carries a
 * tier is left untouched, and an unpaid dancer in a free-tier org keeps NULL
 * rather than being pushed to 'limited' (which would revoke the photo upload
 * she currently has).
 *
 * Returns the tier granted, or null when nothing changed.
 */
export async function grantOrgAccountTier(
  tx: Transaction,
  { userId, orgId }: { userId: string; orgId: string }
): Promise<"standard" | null> {
  const [user] = await tx
    .select({ tier: users.orgAccountTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Already tiered (org-provisioned, or reconciled by an earlier link).
  if (!user || user.tier !== null) return null;

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

  // Every dancer roster row this user holds in this org. A dancer can appear on
  // several events of a recurring competition; paid on any one of them counts,
  // and the tier runs from the latest event.
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

  if (rosterRows.length === 0) return null;

  // Free-tier orgs sell the upgrade themselves: unpaid dancers are not
  // entitled to 'standard', and we leave them NULL rather than downgrading.
  if (freeTier && !rosterRows.some((r) => r.paid === true)) return null;

  const latestEnd = rosterRows
    .map((r) => r.endDate)
    .reduce((a, b) => (a > b ? a : b));

  const expiresAt = new Date(latestEnd);
  expiresAt.setMonth(expiresAt.getMonth() + tierExpiryMonths);

  const updated = await tx
    .update(users)
    .set({ orgAccountTier: "standard", orgAccountTierExpiresAt: expiresAt })
    .where(and(eq(users.id, userId), isNull(users.orgAccountTier)))
    .returning({ id: users.id });

  return updated.length > 0 ? "standard" : null;
}
