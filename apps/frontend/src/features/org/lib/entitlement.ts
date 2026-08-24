import type { components } from "@/lib/api/types";

/**
 * What an Org Event includes is bought per event (ADR 0002), so the org area's
 * convenience gating asks the active Org Event rather than the Org. The
 * backend's `OrgFeatureMiddleware` stays authoritative; this only decides what
 * to show, and must agree with it or it shows Coaches and Dancers features
 * their event does not have.
 */

type OrgPayload = components["schemas"]["OrgsIdResponse"];

/**
 * The capabilities an Event Tier can include, taken from the generated API
 * types rather than restated — the Event Tier they come from is resolved
 * server-side, and a second hand-written list here could drift from it.
 */
export type EventTierCapability = NonNullable<
  OrgPayload["activeEventCapabilities"]
>[number];

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

/** As much of the `GET /orgs/{slug}` payload as gating needs. */
export interface OrgEntitlementSource {
  features?: unknown;
  activeEventCapabilities?: readonly EventTierCapability[] | null;
}

function isOrgConfigurationFlag(key: string): key is OrgConfigurationFlag {
  return (ORG_CONFIGURATION_FLAGS as readonly string[]).includes(key);
}

/** Whether the Org's active event — or the Org itself — includes a gated key. */
export function hasOrgFeature(
  org: OrgEntitlementSource,
  key: OrgFeatureKey,
): boolean {
  if (isOrgConfigurationFlag(key)) {
    const features = (org.features ?? {}) as Record<string, boolean>;
    return Boolean(features[key]);
  }

  return org.activeEventCapabilities?.includes(key) ?? false;
}
