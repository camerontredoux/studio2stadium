export interface OrgAccess {
  membership?: { role: string; type: string } | null;
  myRoster?: { id: string } | null;
  myRosters?: Array<{ id: string; type: string }>;
}

export type OrgArea = "admin" | "coach" | "dancer" | "no-access";

const hasRoster = (access: OrgAccess | null | undefined, type: string) =>
  access?.myRosters?.some((roster) => roster.type === type) ?? false;

/**
 * Where a member of this org belongs once they are signed in.
 *
 * Org membership alone is enough to reach an area — event rosters come and go
 * per event, and a member between events still belongs in their own area (the
 * page shows a pending state). Rosters only pick the area for users who are on
 * an event roster without a membership row. No-access is for neither.
 */
export function resolveOrgArea(access: OrgAccess | null | undefined): OrgArea {
  const role = access?.membership?.role;
  const type = access?.membership?.type;

  if (role === "admin") return "admin";
  if (type === "coach") return "coach";
  if (type === "dancer") return "dancer";

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
