import type { components } from "@/lib/api/types";

/**
 * What an Org Event includes is bought per event (ADR 0002), so the org area's
 * convenience gating asks an Org Event rather than the Org. The backend
 * resolves that answer — the event's Event Tier, with any staff override on the
 * Org applied — and sends the result, so the rule lives in one place and this
 * cannot drift from what `OrgFeatureMiddleware` enforces.
 *
 * Which event depends on what the request will ask for. A Dancer's reads name
 * the event she is viewing and the backend gates on that one
 * (`orgEvent("dancerSelfRead")`), so her gating reads the capabilities sent on
 * her roster for that event (#110). Everything else resolves the Org's active
 * event, so it reads `activeEventCapabilities`.
 *
 * The middleware stays authoritative; this only decides what to show.
 */

type OrgPayload = components["schemas"]["OrgsIdResponse"];

/**
 * The capabilities an Event Tier can include, taken from the generated API
 * types rather than restated — a second hand-written list here could drift from
 * the backend's.
 */
export type EventTierCapability = OrgPayload["activeEventCapabilities"][number];

/**
 * Org-wide configuration that gates UI but is not bought per event. These keys
 * stay on the Org: they are how the Org is set up rather than what it paid for
 * at one Org Event.
 *
 * Gating branches on *this* list rather than on the capabilities, so that the
 * capability names live in one place — the backend — and adding one there needs
 * no matching edit here.
 */
const ORG_CONFIGURATION_FLAGS = ["freeTierUsers"] as const;

export type OrgConfigurationFlag = (typeof ORG_CONFIGURATION_FLAGS)[number];

export type OrgFeatureKey = EventTierCapability | OrgConfigurationFlag;

/** As much of one of the user's rosters as gating needs. */
export interface RosterEntitlement {
  eventId: string;
  type: string;
  capabilities: readonly EventTierCapability[];
}

/** As much of the `GET /orgs/{slug}` payload as gating needs. */
export interface OrgEntitlementSource {
  features?: unknown;
  activeEventCapabilities?: readonly EventTierCapability[];
  myRosters?: readonly RosterEntitlement[];
}

function isOrgConfigurationFlag(key: string): key is OrgConfigurationFlag {
  return (ORG_CONFIGURATION_FLAGS as readonly string[]).includes(key);
}

/**
 * The capabilities in force for the event a request will be gated on.
 *
 * An event the user holds no roster on falls back to the active event: the
 * backend answers a staff preview from the active event, and turns a Dancer
 * away from an event she is not on before any capability is checked.
 */
function capabilitiesFor(
  org: OrgEntitlementSource,
  eventId: string | undefined,
): readonly EventTierCapability[] | undefined {
  const roster = eventId
    ? org.myRosters?.find((candidate) => candidate.eventId === eventId)
    : undefined;
  return roster ? roster.capabilities : org.activeEventCapabilities;
}

/**
 * Whether an Org Event — or the Org itself — includes a gated key.
 *
 * Pass `eventId` when the request being gated names its event (a Dancer's
 * reads); leave it out to ask about the Org's active event.
 */
export function hasOrgFeature(
  org: OrgEntitlementSource,
  key: OrgFeatureKey,
  eventId?: string,
): boolean {
  if (isOrgConfigurationFlag(key)) {
    const features = (org.features ?? {}) as Record<string, boolean>;
    return Boolean(features[key]);
  }

  return capabilitiesFor(org, eventId)?.includes(key) ?? false;
}

/**
 * The event a Dancer is viewing: the one the event switcher put in the URL, or
 * else her first dancer roster — which, active event first, is what the dancer
 * pages request when the URL names none. Undefined when she holds no dancer
 * roster, in which case the backend resolves the Org's active event.
 */
export function viewedDancerEventId(
  myRosters: readonly Pick<RosterEntitlement, "eventId" | "type">[] | undefined,
  searchEventId: string | undefined,
): string | undefined {
  return (
    searchEventId ??
    myRosters?.find((roster) => roster.type === "dancer")?.eventId
  );
}
