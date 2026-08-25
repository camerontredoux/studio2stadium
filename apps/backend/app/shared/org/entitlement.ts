import {
  EVENT_TIER_CAPABILITIES,
  eventTierIncludes,
  type EventTier,
  type EventTierCapability,
} from "./event-tiers.ts";

/**
 * What an Org Event actually includes: what was sold, unless someone at Studio
 * 2 Stadium said otherwise.
 *
 * The Event Tier is the default — it is what the Organizer bought (ADR 0002),
 * and it is what a self-serve purchase that nobody touches by hand resolves to.
 * An explicit flag on `organizations.features` overrides it, in either
 * direction, because staff configure events by hand and buying a bundle is not
 * a reason to lose the ability to turn one thing off. A flag that is *absent*
 * is not an answer of "no": it means nobody has decided, so the Event Tier
 * decides.
 *
 * That distinction is the whole design. Before Event Tiers existed a missing
 * flag was falsy and therefore "no", so the override has to be read from the
 * key's presence rather than its truthiness.
 */

/** A staff override for one capability, or `undefined` when nobody set one. */
export function readCapabilityOverride(
  features: unknown,
  capability: EventTierCapability
): boolean | undefined {
  if (typeof features !== "object" || features === null) return undefined;
  const value = (features as Record<string, unknown>)[capability];
  return typeof value === "boolean" ? value : undefined;
}

/** Whether an Org Event at this Event Tier includes a capability. */
export function includesCapability(args: {
  features: unknown;
  eventTier: EventTier | undefined;
  capability: EventTierCapability;
}): boolean {
  const override = readCapabilityOverride(args.features, args.capability);
  if (override !== undefined) return override;

  return (
    args.eventTier !== undefined &&
    eventTierIncludes(args.eventTier, args.capability)
  );
}

/**
 * Every capability in force for an Org Event, overrides applied.
 *
 * Resolved server-side so that a client cannot hold its own copy of the Event
 * Tier mapping, or of the override rule, and drift from what the middleware
 * enforces.
 */
export function resolveCapabilities(
  features: unknown,
  eventTier: EventTier | undefined
): EventTierCapability[] {
  return EVENT_TIER_CAPABILITIES.filter((capability) =>
    includesCapability({ features, eventTier, capability })
  );
}
