export interface OrgAccess {
  membership?: { role: string; type: string } | null;
  myRoster?: { id: string } | null;
  myRosters?: Array<{ id: string; type: string }>;
}

export type OrgArea = "admin" | "coach" | "dancer" | "no-access";

const hasRoster = (access: OrgAccess | null | undefined, type: string) =>
  access?.myRosters?.some((roster) => roster.type === type) ?? false;

/**
 * Where a member of this org belongs once they are signed in. Membership is the
 * source of truth when it exists, but users can be put on an event roster
 * without a membership row, so rosters act as the fallback signal.
 */
export function resolveOrgArea(access: OrgAccess | null | undefined): OrgArea {
  const role = access?.membership?.role;
  const type = access?.membership?.type;

  if (role === "admin") return "admin";
  if (type === "coach") {
    return hasRoster(access, "coach") || access?.myRoster
      ? "coach"
      : "no-access";
  }
  if (type === "dancer") {
    return hasRoster(access, "dancer") ? "dancer" : "no-access";
  }

  if (hasRoster(access, "coach")) return "coach";
  if (hasRoster(access, "dancer")) return "dancer";
  return "no-access";
}

export function orgAreaPath(orgSlug: string, area: OrgArea): string {
  return `/o/${orgSlug}/${area}`;
}

/** Landing route for a signed-in user inside a given org. */
export function resolveOrgDestination(
  orgSlug: string,
  access: OrgAccess | null | undefined,
): string {
  return orgAreaPath(orgSlug, resolveOrgArea(access));
}

/** Typed route paths for each org area, keyed by area. */
export const ORG_AREA_ROUTES = {
  admin: "/o/$orgSlug/admin",
  coach: "/o/$orgSlug/coach",
  dancer: "/o/$orgSlug/dancer",
  "no-access": "/o/$orgSlug/no-access",
} as const;
