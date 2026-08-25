import { describe, expect, it } from "vitest";

import { hasOrgFeature } from "./entitlement";

const core = [] as const;
const regional = ["check_in", "school_selections", "callbacks"] as const;

describe("hasOrgFeature", () => {
  it("reads the backend's resolved list, not the org's flags", () => {
    expect(
      hasOrgFeature(
        { features: { callbacks: true }, activeEventCapabilities: core },
        "callbacks",
      ),
    ).toBe(false);

    expect(
      hasOrgFeature(
        { features: {}, activeEventCapabilities: regional },
        "callbacks",
      ),
    ).toBe(true);
  });

  it("gates each capability separately", () => {
    const org = { features: {}, activeEventCapabilities: regional };
    expect(hasOrgFeature(org, "check_in")).toBe(true);
    expect(hasOrgFeature(org, "school_selections")).toBe(true);
    expect(hasOrgFeature(org, "video_library")).toBe(false);
  });

  it("grants no capability when the resolved list is empty", () => {
    expect(
      hasOrgFeature(
        { features: { callbacks: true }, activeEventCapabilities: [] },
        "callbacks",
      ),
    ).toBe(false);
  });

  it("still reads org-wide configuration from the org", () => {
    expect(
      hasOrgFeature(
        { features: { freeTierUsers: true }, activeEventCapabilities: core },
        "freeTierUsers",
      ),
    ).toBe(true);
    expect(
      hasOrgFeature(
        { features: {}, activeEventCapabilities: [] },
        "freeTierUsers",
      ),
    ).toBe(false);
  });

  it("treats a missing payload as granting nothing", () => {
    expect(hasOrgFeature({}, "callbacks")).toBe(false);
    expect(hasOrgFeature({}, "freeTierUsers")).toBe(false);
  });
});
