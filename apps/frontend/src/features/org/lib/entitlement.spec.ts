import { describe, expect, it } from "vitest";

import { hasOrgFeature, viewedDancerEventId } from "./entitlement";

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

describe("hasOrgFeature for the event being viewed (#110)", () => {
  const national = [
    "check_in",
    "school_selections",
    "callbacks",
    "video_library",
  ] as const;
  const coreEvent = "00000000-0000-4000-8000-00000000000c";
  const nationalEvent = "00000000-0000-4000-8000-00000000000a";
  const rosters = [
    { eventId: coreEvent, type: "dancer", capabilities: core },
    { eventId: nationalEvent, type: "dancer", capabilities: national },
  ];
  const dancer = { type: "dancer" };

  it("shows a capability the viewed event includes even when the active event does not", () => {
    const org = {
      features: {},
      activeEventCapabilities: core,
      myRosters: rosters,
      membership: dancer,
    };
    expect(hasOrgFeature(org, "callbacks")).toBe(false);
    expect(hasOrgFeature(org, "callbacks", nationalEvent)).toBe(true);
    expect(hasOrgFeature(org, "video_library", nationalEvent)).toBe(true);
  });

  it("hides a capability the viewed event excludes even when the active event includes it", () => {
    const org = {
      features: {},
      activeEventCapabilities: national,
      myRosters: rosters,
      membership: dancer,
    };
    expect(hasOrgFeature(org, "callbacks")).toBe(true);
    expect(hasOrgFeature(org, "callbacks", coreEvent)).toBe(false);
    expect(hasOrgFeature(org, "school_selections", coreEvent)).toBe(false);
  });

  it("answers from the active event for an event she holds no roster on", () => {
    // The backend turns a Dancer who is not on the requested event away
    // before gating at all.
    const org = {
      features: {},
      activeEventCapabilities: regional,
      myRosters: rosters,
      membership: dancer,
    };
    expect(
      hasOrgFeature(org, "callbacks", "00000000-0000-4000-8000-0000000000ff"),
    ).toBe(true);
  });

  it("still reads org-wide configuration from the org whatever the event", () => {
    const org = {
      features: { freeTierUsers: true },
      activeEventCapabilities: core,
      myRosters: rosters,
    };
    expect(hasOrgFeature(org, "freeTierUsers", coreEvent)).toBe(true);
  });

  it("answers a platform admin's staff preview from the active event", () => {
    // The backend skips the dancerSelfRead branch for platform admins and
    // gates them on the active event whatever event they request.
    const org = {
      features: {},
      activeEventCapabilities: core,
      myRosters: rosters,
      membership: dancer,
      platformRole: "admin",
    };
    expect(hasOrgFeature(org, "callbacks", nationalEvent)).toBe(false);
  });

  it("answers a viewer without a dancer membership from the active event", () => {
    // A roster-only viewer, or staff holding a dancer roster, does not take
    // the dancerSelfRead branch either.
    for (const membership of [null, { type: "organizer" }]) {
      const org = {
        features: {},
        activeEventCapabilities: core,
        myRosters: rosters,
        membership,
      };
      expect(hasOrgFeature(org, "callbacks", nationalEvent)).toBe(false);
    }
  });
});

describe("viewedDancerEventId", () => {
  const rosters = [
    { eventId: "coach-event", type: "coach", capabilities: [] },
    { eventId: "first-dancer-event", type: "dancer", capabilities: [] },
    { eventId: "second-dancer-event", type: "dancer", capabilities: [] },
  ];

  it("follows the event the switcher selected", () => {
    expect(viewedDancerEventId(rosters, "second-dancer-event")).toBe(
      "second-dancer-event",
    );
  });

  it("ignores a URL event she holds no dancer roster on", () => {
    expect(viewedDancerEventId(rosters, "stale-event")).toBe(
      "first-dancer-event",
    );
    expect(viewedDancerEventId(rosters, "coach-event")).toBe(
      "first-dancer-event",
    );
  });

  it("defaults to her first dancer roster, which is what the pages request", () => {
    expect(viewedDancerEventId(rosters, undefined)).toBe("first-dancer-event");
  });

  it("is undefined without a dancer roster, so the backend resolves the active event", () => {
    expect(viewedDancerEventId([rosters[0]!], undefined)).toBeUndefined();
    expect(viewedDancerEventId(undefined, undefined)).toBeUndefined();
    expect(viewedDancerEventId([rosters[0]!], "coach-event")).toBeUndefined();
  });
});
