import type { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import type { Transaction } from "#database/service";
import { eq } from "drizzle-orm";
import type { EventTier } from "./event-tiers.ts";

/**
 * Whether an Org is self-serve: an Event Tier purchase has landed on it.
 *
 * Read from `organizations.self_serve`, which provisioning sets and nothing
 * clears, rather than from the purchase rows themselves: those hang off Org
 * Events, and an Organizer who could delete the bought event would otherwise
 * turn their Org back into a grandfathered one and create events for free
 * (#112).
 *
 * Hand-built Orgs that predate billing never had a purchase and are
 * grandfathered (ADR 0006) — unless staff have since made them tier-managed
 * (see `markTierManagedIfBelowEnterprise`). Together the two decide who may
 * create further events — see `assertMayCreateOrgEvent`.
 */
export async function readOrgEventCreation(
  q: typeof db | Transaction,
  orgId: string
): Promise<{ selfServe: boolean; tierManaged: boolean }> {
  const [org] = await q
    .select({
      selfServe: organizations.selfServe,
      tierManaged: organizations.tierManaged,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  return {
    selfServe: org?.selfServe ?? false,
    tierManaged: org?.tierManaged ?? false,
  };
}

/**
 * Makes an Org tier-managed once staff put one of its events below Enterprise.
 *
 * A grandfathered Org's Organizers create events that take the Enterprise
 * default (ADR 0006). Once staff have sold or agreed a lower Event Tier for
 * one of its events, that default would hand the Organizers free Enterprise
 * events beside it, so the Org closes to them for good, as a self-serve Org
 * does (#112). Recorded on `organizations.tier_managed` and never cleared, so
 * neither deleting the event nor moving it back to Enterprise reopens it.
 */
export async function markTierManagedIfBelowEnterprise(
  tx: Transaction,
  orgId: string,
  eventTier: EventTier
): Promise<void> {
  if (eventTier === "enterprise") return;
  await tx
    .update(organizations)
    .set({ tierManaged: true })
    .where(eq(organizations.id, orgId));
}
