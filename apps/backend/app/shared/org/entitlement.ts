import {
  EVENT_TIER_CAPABILITIES,
  eventTierIncludes,
  type EventTier,
  type EventTierCapability,
} from "./event-tiers.ts";
import type {
  CapabilityOverrides,
  orgEvents,
} from "#database/schema/org-events";

/**
 * What an Org Event actually includes: what was sold, unless someone at Studio
 * 2 Stadium said otherwise for that event.
 *
 * The Event Tier is the default — it is what the Organizer bought (ADR 0002),
 * and it is what a self-serve purchase that nobody touches by hand resolves to.
 * An explicit flag in the event's `capability_overrides` overrides it, in
 * either direction, because staff configure events by hand and buying a bundle
 * is not a reason to lose the ability to turn one thing off. A flag that is
 * *absent* is not an answer of "no": it means nobody has decided, so the Event
 * Tier decides.
 *
 * The overrides live on the Org Event rather than the Org (#109), so two events
 * under one Org can carry different exceptions. Before that they sat on
 * `organizations.features`; the migration that moved them copied each Org's
 * flags onto every one of its events, so nothing resolved differently.
 *
 * Before Event Tiers existed a missing flag was falsy and therefore "no", so
 * the override has to be read from the key's presence rather than its
 * truthiness.
 */

/**
 * The staff exceptions on one Org Event, as the `capability_overrides` column
 * stores them. Declared with the schema so the schema needs nothing from
 * `#shared`.
 */
export type { CapabilityOverrides };

// The stored keys must be exactly the Event Tier capabilities, both ways.
type StoredCapability = keyof CapabilityOverrides;
const storedKeysMatchCapabilities: [
  Exclude<StoredCapability, EventTierCapability>,
  Exclude<EventTierCapability, StoredCapability>,
] extends [never, never]
  ? true
  : never = true;
void storedKeysMatchCapabilities;

/** A staff override for one capability, or `undefined` when nobody set one. */
export function readCapabilityOverride(
  overrides: unknown,
  capability: EventTierCapability
): boolean | undefined {
  if (typeof overrides !== "object" || overrides === null) return undefined;
  const value = (overrides as Record<string, unknown>)[capability];
  return typeof value === "boolean" ? value : undefined;
}

/**
 * Only the well-formed overrides in a stored value. The column is JSONB, so it
 * is read defensively: an unknown key or a non-boolean value is not an answer.
 */
export function readCapabilityOverrides(
  overrides: unknown
): CapabilityOverrides {
  const result: CapabilityOverrides = {};
  for (const capability of EVENT_TIER_CAPABILITIES) {
    const value = readCapabilityOverride(overrides, capability);
    if (value !== undefined) result[capability] = value;
  }
  return result;
}

/** The parts of an Org Event that entitlement is resolved from. */
export interface EntitlementSource {
  eventTier: EventTier;
  capabilityOverrides: unknown;
}

/**
 * Whether an Org Event includes a capability. With no event there is nothing
 * to grant from, so nothing is included.
 */
export function includesCapability(
  event: EntitlementSource | undefined,
  capability: EventTierCapability
): boolean {
  if (!event) return false;

  const override = readCapabilityOverride(
    event.capabilityOverrides,
    capability
  );
  if (override !== undefined) return override;

  return eventTierIncludes(event.eventTier, capability);
}

/**
 * Every capability in force for an Org Event, overrides applied.
 *
 * Resolved server-side so that a client cannot hold its own copy of the Event
 * Tier mapping, or of the override rule, and drift from what the middleware
 * enforces.
 */
export function resolveCapabilities(
  event: EntitlementSource | undefined
): EventTierCapability[] {
  return EVENT_TIER_CAPABILITIES.filter((capability) =>
    includesCapability(event, capability)
  );
}

/** One capability of one Org Event, as staff need to see it. */
export interface CapabilityResolution {
  capability: EventTierCapability;
  /** What the Event Tier alone says. */
  eventTierDefault: boolean;
  /** The staff exception, or `null` when the Event Tier decides. */
  override: boolean | null;
  /** What is in force: the override if there is one, else the default. */
  included: boolean;
}

/**
 * Every capability of an Org Event, split into what its Event Tier includes and
 * the exceptions staff set — so the admin surface can show which is which
 * without holding its own copy of the tier mapping.
 */
export function describeCapabilities(
  event: EntitlementSource
): CapabilityResolution[] {
  return EVENT_TIER_CAPABILITIES.map((capability) => {
    const override = readCapabilityOverride(
      event.capabilityOverrides,
      capability
    );
    return {
      capability,
      eventTierDefault: eventTierIncludes(event.eventTier, capability),
      override: override ?? null,
      included: includesCapability(event, capability),
    };
  });
}

/**
 * One Org Event as staff configure its capabilities: what its Event Tier
 * includes, the exceptions set on it, and what is in force (#109).
 */
export interface EventCapabilitiesView {
  id: string;
  name: string;
  isActive: boolean;
  startDate: string;
  eventTier: EventTier;
  capabilities: CapabilityResolution[];
}

export function toEventCapabilitiesView(
  event: Pick<
    typeof orgEvents.$inferSelect,
    | "id"
    | "name"
    | "isActive"
    | "startDate"
    | "eventTier"
    | "capabilityOverrides"
  >
): EventCapabilitiesView {
  return {
    id: event.id,
    name: event.name,
    isActive: event.isActive,
    startDate: event.startDate,
    eventTier: event.eventTier,
    capabilities: describeCapabilities(event),
  };
}
