import type { db } from "#database/connection";
import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { orgEvents } from "#database/schema/org-events";
import type { Transaction } from "#database/service";
import { eq } from "drizzle-orm";

/**
 * Whether an Org is self-serve: at least one of its Org Events was bought.
 *
 * Hand-built Orgs that predate billing have no purchase and are grandfathered
 * (ADR 0006). The difference decides who may create further events — see
 * `assertMayCreateOrgEvent`.
 */
export async function isSelfServeOrg(
  q: typeof db | Transaction,
  orgId: string
): Promise<boolean> {
  const [purchase] = await q
    .select({ id: eventTierPurchases.id })
    .from(eventTierPurchases)
    .innerJoin(orgEvents, eq(orgEvents.id, eventTierPurchases.eventId))
    .where(eq(orgEvents.orgId, orgId))
    .limit(1);
  return purchase !== undefined;
}
