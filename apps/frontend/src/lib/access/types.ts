import type { ApiSchemas } from "../api/client";

export type Role = ApiSchemas["AuthSessionResponse"]["role"];
export type Platform = ApiSchemas["AuthSessionResponse"]["platforms"][number];
export type AccountType = ApiSchemas["AuthSessionResponse"]["type"];

/**
 * A permission domain is a platform and a profile type. An `organizer` account
 * has no profile and no domain of its own: it administers its Org through its
 * org membership, never through these permissions.
 */
export type Domain = `${Platform}:${Exclude<AccountType, "organizer">}`;

/**
 * What a person is inside an Org. `organizer` runs the Org's events and buys
 * S2S Live; they administer the Org but never evaluate Dancers and never appear
 * on a Roster — see docs/adr/0003-organizer-is-a-distinct-member-type.md.
 */
export type OrgMemberType = ApiSchemas["AdminOrgsIdMembersRequest"]["type"];

/**
 * The subset of member types a Roster Entry may hold. Anything roster-shaped —
 * a roster row, a CSV upload, an admin previewing the event — is one of these,
 * never an Organizer.
 */
export type RosterType = Exclude<OrgMemberType, "organizer">;

export const ORG_MEMBER_TYPE_LABELS: Record<OrgMemberType, string> = {
  coach: "Coach",
  dancer: "Dancer",
  organizer: "Organizer",
};
