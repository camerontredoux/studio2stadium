import { describe, expect, it } from "vitest";

import {
  canCreateOrgEvent,
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

  it("lets only staff create events in a self-serve Org", () => {
    const organizer = { role: "user" };
    const staff = { role: "admin" };
    expect(canCreateOrgEvent({ session: organizer, orgSelfServe: true })).toBe(
      false,
    );
    expect(canCreateOrgEvent({ session: staff, orgSelfServe: true })).toBe(true);
    expect(canCreateOrgEvent({ session: organizer, orgSelfServe: false })).toBe(
      true,
    );
  });
});
