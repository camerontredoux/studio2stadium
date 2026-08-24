import type { OrgMemberType } from "./types";

/**
 * Whether an org membership administers the Org. An Organizer buys S2S Live and
 * runs its events, so the type alone grants admin access; `role` stays
 * meaningful for coaches and dancers promoted to admin. Mirrors
 * `grantsOrgAdmin` in the backend's `#shared/org/membership`.
 */
export function grantsOrgAdmin(
  membership:
    | { role: "admin" | "member"; type: OrgMemberType }
    | null
    | undefined,
): boolean {
  if (!membership) return false;
  return membership.role === "admin" || membership.type === "organizer";
}
