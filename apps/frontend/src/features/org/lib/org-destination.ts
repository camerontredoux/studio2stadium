import {
  grantsOrgAdmin,
  type AccountType,
  type OrgMemberType,
  type RosterType,
} from "@/lib/access";

export interface OrgAccess {
  membership?: { role: "admin" | "member"; type: OrgMemberType } | null;
  myRoster?: { id: string } | null;
  myRosters?: Array<{ id: string; type: RosterType }>;
}

export type OrgArea = "admin" | "coach" | "dancer" | "no-access";

const hasRoster = (access: OrgAccess | null | undefined, type: RosterType) =>
  access?.myRosters?.some((roster) => roster.type === type) ?? false;

/**
 * Where a member of this org belongs once they are signed in. Membership is the
 * source of truth when it exists, but users can be put on an event roster
 * without a membership row, so rosters act as the fallback signal.
 *
 * A member type with no area of its own falls through to the roster signal
 * rather than guessing, so adding one can never route someone somewhere they
 * do not belong.
 */
export function resolveOrgArea(access: OrgAccess | null | undefined): OrgArea {
  const type = access?.membership?.type;

  // An Organizer runs the Org's events and administers it by definition, with
  // no Roster Entry of their own (ADR 0003). Checked before the roster
  // fallbacks so an organizer who also coaches still lands in the admin area.
  if (grantsOrgAdmin(access?.membership)) return "admin";
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

/** The parts of the session that decide where a signed-in user belongs. */
interface OrgSession {
  type: AccountType;
  profileId?: string | null;
  orgMemberships: ReadonlyArray<{
    orgSlug: string;
    role: "admin" | "member";
    type: OrgMemberType;
  }>;
}

/**
 * Whether a signed-in user has to finish profile onboarding before entering
 * this Org. Dancers and school coaches do, because the product around the Org
 * is built on their profile. An Organizer administering the Org does not: they
 * run its events rather than appear in them (ADR 0003), and one who signed up
 * to buy an event has no profile to finish — onboarding would turn them into a
 * dancer on their way to the admin area they paid for.
 */
export function needsProfileOnboarding(
  session: OrgSession,
  orgSlug: string,
): boolean {
  if (session.profileId) return false;
  // An Organizer account has no profile to finish, anywhere.
  if (session.type === "organizer") return false;

  return !session.orgMemberships.some(
    (membership) => membership.orgSlug === orgSlug && grantsOrgAdmin(membership),
  );
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

/**
 * The Org an Organizer account belongs in: the first one it administers, in
 * the order the session lists them. Null when it administers none, such as
 * after staff deleted its only Org.
 */
export function organizerOrgSlug(session: OrgSession): string | null {
  return (
    session.orgMemberships.find((membership) => grantsOrgAdmin(membership))
      ?.orgSlug ?? null
  );
}

/**
 * The pages outside an Org that an Organizer account may still open: its own
 * account details, its password, and signing out.
 */
const ORGANIZER_OWN_PAGES = [
  "/settings/account",
  "/settings/password",
  "/logout",
] as const;

export type OrganizerRedirect =
  | { to: "/o/$orgSlug/admin"; params: { orgSlug: string } }
  | { to: "/settings/account" };

/**
 * Where to send an Organizer account that opened a page of the profile
 * product (feed, explore, onboarding and the rest), which is built on a dancer
 * or school profile it does not have: its Org's admin area, the place it
 * bought. Null for any other account, and for the Organizer's own account
 * pages. An Organizer with no Org left lands on its account page, which never
 * redirects again.
 */
export function organizerRedirect(
  session: OrgSession,
  pathname: string,
): OrganizerRedirect | null {
  if (session.type !== "organizer") return null;

  const ownPage = ORGANIZER_OWN_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );
  if (ownPage) return null;

  const orgSlug = organizerOrgSlug(session);
  return orgSlug
    ? { to: "/o/$orgSlug/admin", params: { orgSlug } }
    : { to: "/settings/account" };
}
