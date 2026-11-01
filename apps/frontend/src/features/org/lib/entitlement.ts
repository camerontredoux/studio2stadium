import type { components } from "@/lib/api/types";

/**
 * What an Org Event includes is bought per event (ADR 0002), so the org area's
 * convenience gating asks an Org Event rather than the Org. The backend
 * resolves that answer — the event's Event Tier, with any staff override on
 * that event applied — and sends the result, so the rule lives in one place
 * and this cannot drift from what `OrgFeatureMiddleware` enforces.
 *
 * Which event depends on what the request will ask for. A Dancer's reads name
 * the event she is viewing and the backend gates on that one
 * (`orgEvent("dancerSelfRead")`), so her gating reads the capabilities sent on
 * her roster for that event (#110). Everything else — a platform admin's staff
 * preview included — resolves the Org's active event, so it reads
 * `activeEventCapabilities`.
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
  /** The viewer's effective membership in the Org. */
  membership?: { type: string } | null;
  /** The viewer's platform role, from the session — not in the org payload. */
  platformRole?: string;
}

function isOrgConfigurationFlag(key: string): key is OrgConfigurationFlag {
  return (ORG_CONFIGURATION_FLAGS as readonly string[]).includes(key);
}

/**
 * Whether the backend gates this viewer's dancer reads on the event they name,
 * mirroring `OrgEventMiddleware`'s `dancerSelfRead` branch: not a platform
 * admin, and a Dancer by membership. The effective membership is enough here —
 * anyone whose effective type is not `dancer` is routed out of the dancer area
 * unless they are a platform admin. Everyone else is gated on the active event.
 */
function gatesOnRequestedEvent(org: OrgEntitlementSource): boolean {
  return org.platformRole !== "admin" && org.membership?.type === "dancer";
}

/**
 * The capabilities in force for the event a request will be gated on.
 *
 * An event the user holds no roster on falls back to the active event: the
 * backend turns a Dancer away from an event she is not on before any
 * capability is checked. So does a viewer the backend gates on the active
 * event whatever they request, such as a platform admin's staff preview.
 */
function capabilitiesFor(
  org: OrgEntitlementSource,
  eventId: string | undefined,
): readonly EventTierCapability[] | undefined {
  const roster =
    eventId && gatesOnRequestedEvent(org)
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
 * pages request when the URL names none. A URL event she holds no dancer
 * roster on (stale or hand-edited) is ignored the same way, so the page, its
 * guard and the menu all describe one event. Undefined when she holds no
 * dancer roster, in which case the backend resolves the Org's active event.
 */
export function viewedDancerEventId(
  myRosters: readonly Pick<RosterEntitlement, "eventId" | "type">[] | undefined,
  searchEventId: string | undefined,
): string | undefined {
  const dancerRosters =
    myRosters?.filter((roster) => roster.type === "dancer") ?? [];
  const selected = dancerRosters.find(
    (roster) => roster.eventId === searchEventId,
  );
  return (selected ?? dancerRosters[0])?.eventId;
}
