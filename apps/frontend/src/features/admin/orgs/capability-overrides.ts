import type { components } from "@/lib/api/types";

/**
 * One Org Event as staff configure its capabilities (#109): the backend sends,
 * per capability, what the Event Tier includes, the exception set on the event
 * and what is in force, so nothing here restates the tier mapping or the
 * override rule.
 */
export type EventCapabilities =
  components["schemas"]["AdminOrgsIdEventsResponse"][number];

export type CapabilityResolution = EventCapabilities["capabilities"][number];

/** The capabilities an Event Tier can include, as the backend names them. */
export type EventTierCapability = CapabilityResolution["capability"];

/** The staff exceptions on one event, as the update endpoint takes them. */
export type CapabilityOverrides = Partial<Record<EventTierCapability, boolean>>;

/**
 * What staff pick for one capability: leave it to the Event Tier, or make an
 * exception either way.
 */
export type OverrideChoice = "default" | "on" | "off";

const CAPABILITY_LABELS: Record<
  EventTierCapability,
  { label: string; description: string }
> = {
  callbacks: {
    label: "Callbacks",
    description: "Coaches mark dancers for callbacks",
  },
  check_in: {
    label: "Check-In",
    description: "Dancer and coach check-in at the event",
  },
  school_selections: {
    label: "School Selections",
    description: "Dancers select schools they are interested in",
  },
  video_library: {
    label: "Video Library",
    description: "The event's video library",
  },
};

export function capabilityLabel(capability: EventTierCapability) {
  return CAPABILITY_LABELS[capability];
}

export function overrideChoice(
  resolution: CapabilityResolution,
): OverrideChoice {
  if (resolution.override === null) return "default";
  return resolution.override ? "on" : "off";
}

/** How the "leave it to the Event Tier" option reads for this capability. */
export function defaultChoiceLabel(resolution: CapabilityResolution): string {
  return `Event Tier default (${resolution.eventTierDefault ? "included" : "not included"})`;
}

export const EXCEPTION_CHOICES: { value: OverrideChoice; label: string }[] = [
  { value: "on", label: "Always on" },
  { value: "off", label: "Always off" },
];

/**
 * The event's full set of overrides with one capability changed. The endpoint
 * replaces the set whole, so every other exception is carried along.
 */
export function overridesWithChoice(
  capabilities: readonly CapabilityResolution[],
  capability: EventTierCapability,
  choice: OverrideChoice,
): CapabilityOverrides {
  const overrides: CapabilityOverrides = {};
  for (const resolution of capabilities) {
    if (resolution.capability === capability) continue;
    if (resolution.override !== null) {
      overrides[resolution.capability] = resolution.override;
    }
  }
  if (choice !== "default") overrides[capability] = choice === "on";
  return overrides;
}
