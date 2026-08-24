import { describe, expect, it } from "vitest";

import { resolveOrgArea, resolveOrgDestination } from "./org-destination";

const dancerRoster = { id: "r1", type: "dancer" };
const coachRoster = { id: "r2", type: "coach" };

describe("resolveOrgArea", () => {
  it("sends org admins to the admin area", () => {
    expect(
      resolveOrgArea({ membership: { role: "admin", type: "coach" } }),
    ).toBe("admin");
  });

  it("sends organizers to the admin area, roster or not", () => {
    expect(
      resolveOrgArea({ membership: { role: "member", type: "organizer" } }),
    ).toBe("admin");
    expect(
      resolveOrgArea({ membership: { role: "admin", type: "organizer" } }),
    ).toBe("admin");
  });

  it("still sends an organizer who also coaches to the admin area", () => {
    expect(
      resolveOrgArea({
        membership: { role: "member", type: "organizer" },
        myRosters: [coachRoster],
      }),
    ).toBe("admin");
  });

  it("sends coaches to the coach area", () => {
    expect(
      resolveOrgArea({
        membership: { role: "member", type: "coach" },
        myRosters: [coachRoster],
      }),
    ).toBe("coach");
  });

  it("sends dancers to the dancer area", () => {
    expect(
      resolveOrgArea({
        membership: { role: "member", type: "dancer" },
        myRosters: [dancerRoster],
      }),
    ).toBe("dancer");
  });

  it("falls back to rosters when the user has no membership row", () => {
    expect(resolveOrgArea({ myRosters: [dancerRoster] })).toBe("dancer");
    expect(resolveOrgArea({ myRosters: [coachRoster] })).toBe("coach");
  });

  it("reports no access when the user is on no roster", () => {
    expect(resolveOrgArea({ membership: null, myRosters: [] })).toBe(
      "no-access",
    );
    expect(resolveOrgArea(null)).toBe("no-access");
    expect(
      resolveOrgArea({
        membership: { role: "member", type: "dancer" },
        myRosters: [],
      }),
    ).toBe("no-access");
  });
});

describe("resolveOrgDestination", () => {
  it("keeps signed-in users inside their org instead of the s2s feed", () => {
    expect(
      resolveOrgDestination("hoosier", { myRosters: [dancerRoster] }),
    ).toBe("/o/hoosier/dancer");
    expect(resolveOrgDestination("hoosier", null)).toBe("/o/hoosier/no-access");
  });
});
