import type { components } from "@/lib/api/types";

/**
 * The Event Tier bought for one Org Event (ADR 0002) — not a Dancer's Account
 * Tier. The names come from the generated API types, so a tier added on the
 * backend fails to compile here until it has a label.
 */
export type EventTier =
  components["schemas"]["OrgsIdEventsIdResponse"]["eventTier"];

const EVENT_TIER_LABELS: Record<EventTier, string> = {
  core: "Core",
  regional: "Regional",
  national: "National",
  enterprise: "Enterprise",
};

/** Every Event Tier, lowest first, as the backend orders them. */
export const EVENT_TIERS = [
  "core",
  "regional",
  "national",
  "enterprise",
] as const satisfies readonly EventTier[];

// `satisfies` refuses an unknown tier; this refuses a missing one, so a tier
// added on the backend cannot compile and be left out of the staff select.
type MissingEventTier = Exclude<EventTier, (typeof EVENT_TIERS)[number]>;
const everyEventTierListed: [MissingEventTier] extends [never] ? true : never =
  true;
void everyEventTierListed;

export const EVENT_TIER_OPTIONS = EVENT_TIERS.map((value) => ({
  value,
  label: EVENT_TIER_LABELS[value],
}));

export function eventTierLabel(tier: EventTier): string {
  return EVENT_TIER_LABELS[tier];
}

/**
 * Whether this user may set an Org Event's Event Tier: Studio 2 Stadium staff,
 * i.e. a site admin. Mirrors the backend rule, which stays authoritative.
 */
export function canSetEventTier(session: { role: string }): boolean {
  return session.role === "admin";
}

/**
 * Whether this user may create an Org Event in this Org. In a self-serve Org
 * (one with a purchase) further events are bought or arranged with S2S, so only
 * staff create them. Grandfathered Orgs are unchanged. Mirrors the backend's
 * `assertMayCreateOrgEvent`, which stays authoritative.
 */
export function canCreateOrgEvent(args: {
  session: { role: string };
  orgSelfServe: boolean;
}): boolean {
  return !args.orgSelfServe || canSetEventTier(args.session);
}

/** Shown where an Organizer of a self-serve Org would create an event. */
export const BUY_ANOTHER_EVENT_MESSAGE =
  "To add another event, buy one or contact Studio 2 Stadium.";
