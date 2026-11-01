import type { db } from "#database/connection";
import { isRosterTypeSql, type OrgMemberType } from "#database/schema/enums";
import { orgMemberships } from "#database/schema/organizations";
import { and, eq } from "drizzle-orm";

type AnyDb = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

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
export const rosterTypeMembershipConflict = () => ({
  target: [orgMemberships.userId, orgMemberships.orgId],
  // Same fragment the index is declared with, so Postgres can infer it.
  where: isRosterTypeSql(),
});

/**
 * Every membership a person holds in one Org. Always read the full set: since
 * an Organizer may also coach at their own event (ADR 0003), a single-row
 * lookup would return an arbitrary one of the two. Collapse with
 * `resolveEffectiveMembership`, or ask `hasMemberType` about a specific type.
 */
export async function loadOrgMemberships(
  conn: AnyDb,
  userId: string,
  orgId: string
) {
  return conn
    .select()
    .from(orgMemberships)
    .where(
      and(eq(orgMemberships.userId, userId), eq(orgMemberships.orgId, orgId))
    );
}
