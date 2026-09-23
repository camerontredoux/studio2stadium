import { describe, expect, it } from "vitest";

import {
  canSetEventTier,
  EVENT_TIER_OPTIONS,
  eventTierLabel,
} from "./event-tiers";

describe("Event Tier options", () => {
  it("lists every Event Tier, lowest first, with a label", () => {
    expect(EVENT_TIER_OPTIONS).toEqual([
      { value: "core", label: "Core" },
      { value: "regional", label: "Regional" },
      { value: "national", label: "National" },
      { value: "enterprise", label: "Enterprise" },
    ]);
    expect(eventTierLabel("national")).toBe("National");
  });

  it("lets only site admins (S2S staff) set an Event Tier", () => {
    expect(canSetEventTier({ role: "admin" })).toBe(true);
    expect(canSetEventTier({ role: "user" })).toBe(false);
    expect(canSetEventTier({ role: "prodigy_admin" })).toBe(false);
  });
});
