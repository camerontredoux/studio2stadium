import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { orgEvents } from "#database/schema/org-events";
import { orgMemberships, organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { type Transaction } from "#database/service";
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";

/** An Org the user now administers because they claimed it. */
export interface ClaimedOrg {
  id: string;
  name: string;
  slug: string;
}

/**
 * Finish every claim this user has pending, inside the caller's transaction.
 * The caller has just seen proof that the user reads the account's inbox — a
 * claim link, or a password link — so this:
 *
 * - records that proof (`users.emailVerifiedAt`), so later purchases attach
 *   straight away;
 * - gives the user the organizer admin membership each pending purchase
 *   withheld (ADR 0007);
 * - marks those purchases claimed.
 *
 * Idempotent: the pending purchases are locked, an existing membership is
 * kept, and a second run finds nothing pending. `users.verified` is left
 * alone: it means "onboarded" for dancers and "application accepted" for
 * schools, not "owns the inbox".
 *
 * Returns every Org this user has claimed, including ones claimed earlier, so
 * a repeated claim still has somewhere to send them.
 */
export async function completePendingClaims(
  tx: Transaction,
  userId: string
): Promise<ClaimedOrg[]> {
  await tx
    .update(users)
    .set({ emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, now())` })
    .where(eq(users.id, userId));

  const pending = await tx
    .select({ id: eventTierPurchases.id, orgId: orgEvents.orgId })
    .from(eventTierPurchases)
    .innerJoin(orgEvents, eq(orgEvents.id, eventTierPurchases.eventId))
    .where(
      and(
        eq(eventTierPurchases.buyerId, userId),
        eq(eventTierPurchases.claimRequired, true),
        isNull(eventTierPurchases.claimedAt)
      )
    )
    .for("update", { of: eventTierPurchases });

  for (const purchase of pending) {
    await tx
      .insert(orgMemberships)
      .values({
        orgId: purchase.orgId,
        userId,
        role: "admin",
        type: "organizer",
      })
      .onConflictDoNothing();

    await tx
      .update(eventTierPurchases)
      .set({ claimedAt: new Date() })
      .where(eq(eventTierPurchases.id, purchase.id));
  }

  const claimed = await tx
    .selectDistinct({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
    })
    .from(eventTierPurchases)
    .innerJoin(orgEvents, eq(orgEvents.id, eventTierPurchases.eventId))
    .innerJoin(organizations, eq(organizations.id, orgEvents.orgId))
    .where(
      and(
        eq(eventTierPurchases.buyerId, userId),
        eq(eventTierPurchases.claimRequired, true),
        isNotNull(eventTierPurchases.claimedAt)
      )
    );

  return claimed;
}
