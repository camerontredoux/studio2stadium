import type { OrgMemberType } from "#database/schema/enums";
import { orgMemberships } from "#database/schema/organizations";
import { sql } from "drizzle-orm";

/**
 * The part of an `org_memberships` row that access decisions read. Kept
 * structural so callers can pass a full row or a two-column projection.
 */
export interface OrgMembershipLike {
  role: "admin" | "member";
  type: OrgMemberType;
}

/**
 * Highest privilege first. An Organizer runs the Org, so their membership
 * outranks the coach or dancer membership the same person may also hold.
 */
const TYPE_PRECEDENCE: readonly OrgMemberType[] = [
  "organizer",
  "coach",
  "dancer",
];

/**
 * Whether a membership administers the Org. An Organizer buys S2S Live and runs
 * its events, so the type alone grants admin access — the `role` column stays
 * meaningful for coaches and dancers promoted to admin (ADR 0003).
 */
export function grantsOrgAdmin(
  membership: OrgMembershipLike | null | undefined
): boolean {
  if (!membership) return false;
  return membership.role === "admin" || membership.type === "organizer";
}

/** Whether any of the user's memberships in this org has the given type. */
export function hasMemberType(
  memberships: readonly OrgMembershipLike[],
  type: OrgMemberType
): boolean {
  return memberships.some((m) => m.type === type);
}

/**
 * The single membership downstream code should treat as "the" membership when
 * a person holds more than one in the same Org — an Organizer who also coaches
 * at their own event. Admin rows win, then organizer over coach over dancer, so
 * the choice is deterministic rather than whichever row the database returned
 * first. Checks that care about a specific type should use `hasMemberType`.
 */
export function resolveEffectiveMembership<T extends OrgMembershipLike>(
  memberships: readonly T[]
): T | null {
  if (memberships.length === 0) return null;

  return [...memberships].sort((a, b) => {
    const adminDiff = Number(grantsOrgAdmin(b)) - Number(grantsOrgAdmin(a));
    if (adminDiff !== 0) return adminDiff;
    return TYPE_PRECEDENCE.indexOf(a.type) - TYPE_PRECEDENCE.indexOf(b.type);
  })[0]!;
}

/**
 * Conflict target for "give this person a coach or dancer membership unless
 * they already have one". Coach and dancer remain mutually exclusive per Org;
 * an organizer membership sits alongside them and is deliberately outside this
 * index, so upserting one never disturbs the other (ADR 0003).
 */
export const nonOrganizerMembershipConflict = () => ({
  target: [orgMemberships.userId, orgMemberships.orgId],
  // Must match the index predicate for Postgres to infer the partial index.
  where: sql`type in ('coach', 'dancer')`,
});
