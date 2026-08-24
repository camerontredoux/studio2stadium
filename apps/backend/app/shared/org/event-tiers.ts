import { eventTier as eventTierEnum } from "#database/schema/enums";
import { DEFAULT_MAX_CALLBACKS_PER_COACH } from "./max-callbacks.ts";

/**
 * The four Event Tiers, and what each one includes.
 *
 * An Event Tier is what an Organizer buys for one Org Event (ADR 0001): a sold
 * name mapping to the capabilities that event includes and the limits that go
 * with them. It is not a Dancer's Account Tier — `grantOrgAccountTier` owns
 * that, and bare "tier" is ambiguous in this codebase. See CONTEXT.md.
 *
 * This module is the one place the mapping lives, so that what is sold on the
 * marketing page and what is enforced in the product are the same fact.
 * `OrgFeatureMiddleware` resolves every gated capability through it, from the
 * Event Tier of the Org Event the request is against.
 */

/** The sold names, ordered by what they include — see `enums.ts`. */
export const EVENT_TIERS = eventTierEnum.enumValues;

export type EventTier = (typeof EVENT_TIERS)[number];

/**
 * The capabilities an Event Tier can include. These are exactly the keys already
 * gated by `OrgFeatureMiddleware` and the frontend route guards, reused rather
 * than renamed. `freeTierUsers` is deliberately absent: it is org configuration
 * rather than something bought per event, and stays on `organizations.features`.
 */
export const EVENT_TIER_CAPABILITIES = [
  "callbacks",
  "check_in",
  "school_selections",
  "video_library",
] as const;

export type EventTierCapability = (typeof EVENT_TIER_CAPABILITIES)[number];

const CAPABILITY_KEYS: ReadonlySet<string> = new Set(EVENT_TIER_CAPABILITIES);

/**
 * Whether a gated key is bought with the Org Event or configured on the Org.
 *
 * `OrgFeatureMiddleware` and the frontend guards gate on both kinds of key
 * through one call, so something has to say which side of the line a key falls.
 * A key that is not a capability — `freeTierUsers` today — keeps resolving from
 * `organizations.features`.
 */
export function isEventTierCapability(key: string): key is EventTierCapability {
  return CAPABILITY_KEYS.has(key);
}

/** Schools one Dancer may select at an event, as shipped today. */
export const DEFAULT_MAX_SCHOOL_SELECTIONS = 3;

/**
 * A limit is `null` when the Event Tier does not include the capability it
 * bounds. Zero would be the obvious way to write "none", but zero is already
 * spoken for: `resolveMaxCallbacks` reads anything below 1 as *unlimited*, so a
 * Core event written as `0` would come out uncapped the moment anything wired
 * these limits to that helper.
 */
export interface EventTierLimits {
  /** Callbacks one Coach may publish per showcase. */
  maxCallbacksPerCoach: number | null;
  /** Schools one Dancer may select at the event. */
  maxSchoolSelections: number | null;
}

export interface EventTierDefinition {
  capabilities: readonly EventTierCapability[];
  limits: EventTierLimits;
}

/**
 * What the limits are wherever a tier includes the capability they bound: the
 * numbers already shipped, so that resolving a limit from the Event Tier gives
 * every event exactly what it has today. Nothing sold distinguishes the tiers by
 * how much — the marketing cards differ only in which capabilities they include
 * — so raising a tier's ceiling is a commercial decision to be taken when
 * someone sells it, not one to invent here.
 */
const LIMITS_WHEN_INCLUDED: EventTierLimits = {
  maxCallbacksPerCoach: DEFAULT_MAX_CALLBACKS_PER_COACH,
  maxSchoolSelections: DEFAULT_MAX_SCHOOL_SELECTIONS,
};

/**
 * Sold name to capabilities and limits.
 *
 * Read up the marketing cards: Core is the dashboard, roster, profiles and
 * notes, with none of the four gated capabilities; Regional adds the day-of
 * tools (check-in, school selections, callbacks); National adds the video
 * library; Enterprise is everything. A Core event's limits are `null` because it
 * has neither capability to bound.
 */
export const EVENT_TIER_DEFINITIONS: Record<EventTier, EventTierDefinition> = {
  core: {
    capabilities: [],
    limits: { maxCallbacksPerCoach: null, maxSchoolSelections: null },
  },
  regional: {
    capabilities: ["check_in", "school_selections", "callbacks"],
    limits: LIMITS_WHEN_INCLUDED,
  },
  national: {
    capabilities: [
      "check_in",
      "school_selections",
      "callbacks",
      "video_library",
    ],
    limits: LIMITS_WHEN_INCLUDED,
  },
  enterprise: {
    capabilities: EVENT_TIER_CAPABILITIES,
    limits: LIMITS_WHEN_INCLUDED,
  },
};

/** Whether an Event Tier includes a capability. */
export function eventTierIncludes(
  eventTier: EventTier,
  capability: EventTierCapability
): boolean {
  return EVENT_TIER_DEFINITIONS[eventTier].capabilities.includes(capability);
}

/** The limits that come with an Event Tier. */
export function eventTierLimits(eventTier: EventTier): EventTierLimits {
  return EVENT_TIER_DEFINITIONS[eventTier].limits;
}
