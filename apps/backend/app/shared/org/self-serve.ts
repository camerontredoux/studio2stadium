import type { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import type { Transaction } from "#database/service";
import { eq } from "drizzle-orm";

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
 * grandfathered (ADR 0006). The difference decides who may create further
 * events — see `assertMayCreateOrgEvent`.
 */
export async function isSelfServeOrg(
  q: typeof db | Transaction,
  orgId: string
): Promise<boolean> {
  const [org] = await q
    .select({ selfServe: organizations.selfServe })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  return org?.selfServe ?? false;
}
