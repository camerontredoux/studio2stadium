import { describe, expect, it } from "vitest";

import { hasOrgFeature } from "./entitlement";

const coreEvent = { id: "e1", eventTier: "core", capabilities: [] } as const;
const regionalEvent = {
  id: "e2",
  eventTier: "regional",
  capabilities: ["check_in", "school_selections", "callbacks"],
} as const;

describe("hasOrgFeature", () => {
  it("gates a capability on the active event, not the org", () => {
    expect(
      hasOrgFeature(
        { features: { callbacks: true }, activeEvent: coreEvent },
        "callbacks",
      ),
    ).toBe(false);

    expect(
      hasOrgFeature(
        { features: {}, activeEvent: regionalEvent },
        "callbacks",
      ),
    ).toBe(true);
  });

  it("gates each capability separately", () => {
    const org = { features: {}, activeEvent: regionalEvent };
    expect(hasOrgFeature(org, "check_in")).toBe(true);
    expect(hasOrgFeature(org, "school_selections")).toBe(true);
    expect(hasOrgFeature(org, "video_library")).toBe(false);
  });

  it("grants no capability when there is no active event", () => {
    expect(
      hasOrgFeature(
        { features: { callbacks: true }, activeEvent: null },
        "callbacks",
      ),
    ).toBe(false);
  });

  it("still reads org-wide configuration from the org", () => {
    expect(
      hasOrgFeature(
        { features: { freeTierUsers: true }, activeEvent: coreEvent },
        "freeTierUsers",
      ),
    ).toBe(true);
    expect(
      hasOrgFeature({ features: {}, activeEvent: null }, "freeTierUsers"),
    ).toBe(false);
  });

  it("treats a missing payload as granting nothing", () => {
    expect(hasOrgFeature({}, "callbacks")).toBe(false);
    expect(hasOrgFeature({}, "freeTierUsers")).toBe(false);
  });
});
