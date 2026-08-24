/**
 * What an Org Event includes is bought per event (ADR 0002), so the org area's
 * convenience gating asks the active Org Event rather than the Org. The
 * backend's `OrgFeatureMiddleware` stays authoritative; this only decides what
 * to show, and must agree with it or it shows Coaches and Dancers features
 * their event does not have.
 *
 * The capability list arrives resolved on `GET /orgs/{slug}`, so the mapping
 * from Event Tier to capabilities lives on the backend alone.
 */

/** The capabilities an Event Tier can include, as gated by the backend. */
export const EVENT_TIER_CAPABILITIES = [
  "callbacks",
  "check_in",
  "school_selections",
  "video_library",
] as const;

export type EventTierCapability = (typeof EVENT_TIER_CAPABILITIES)[number];

/**
 * Org-wide configuration that gates UI but is not bought per event. These keys
 * stay on the Org: they are how the Org is set up rather than what it paid for
 * at one Org Event.
 */
export type OrgConfigurationFlag = "freeTierUsers";

export type OrgFeatureKey = EventTierCapability | OrgConfigurationFlag;

/** As much of the `GET /orgs/{slug}` payload as gating needs. */
export interface OrgEntitlementSource {
  features?: unknown;
  activeEvent?: { capabilities: readonly string[] } | null;
}

export function isEventTierCapability(
  key: string,
): key is EventTierCapability {
  return (EVENT_TIER_CAPABILITIES as readonly string[]).includes(key);
}

/** Whether the Org's active event — or the Org itself — includes a gated key. */
export function hasOrgFeature(
  org: OrgEntitlementSource,
  key: OrgFeatureKey,
): boolean {
  if (isEventTierCapability(key)) {
    return org.activeEvent?.capabilities.includes(key) ?? false;
  }

  const features = (org.features ?? {}) as Record<string, boolean>;
  return Boolean(features[key]);
}
