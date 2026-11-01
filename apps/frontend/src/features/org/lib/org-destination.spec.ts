import { describe, expect, it } from "vitest";

import {
  needsProfileOnboarding,
  organizerOrgSlug,
  organizerRedirect,
  resolveOrgArea,
  resolveOrgDestination,
} from "./org-destination";

const dancerRoster = { id: "r1", type: "dancer" } as const;
const coachRoster = { id: "r2", type: "coach" } as const;

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

describe("needsProfileOnboarding", () => {
  const organizer = {
    orgSlug: "summit",
    role: "admin",
    type: "organizer",
  } as const;

  it("lets a profile-less dancer account into the Org it administers", () => {
    expect(
      needsProfileOnboarding(
        { type: "dancer", orgMemberships: [organizer] },
        "summit",
      ),
    ).toBe(false);
  });

  it("still onboards that account into an Org it does not administer", () => {
    expect(
      needsProfileOnboarding(
        { type: "dancer", orgMemberships: [organizer] },
        "hoosier",
      ),
    ).toBe(true);
  });

  it("never onboards an Organizer account, in any Org", () => {
    for (const orgSlug of ["summit", "hoosier"]) {
      expect(
        needsProfileOnboarding(
          { type: "organizer", orgMemberships: [organizer] },
          orgSlug,
        ),
      ).toBe(false);
    }
  });

  it("still onboards a profile-less dancer member", () => {
    expect(
      needsProfileOnboarding(
        {
          type: "dancer",
          orgMemberships: [
            { orgSlug: "summit", role: "member", type: "dancer" },
          ],
        },
        "summit",
      ),
    ).toBe(true);
  });

  it("never onboards someone who already has a profile", () => {
    expect(
      needsProfileOnboarding(
        { type: "dancer", profileId: "p1", orgMemberships: [] },
        "summit",
      ),
    ).toBe(false);
  });
});

describe("organizerRedirect", () => {
  const organizerAccount = {
    type: "organizer",
    orgMemberships: [
      { orgSlug: "hoosier", role: "member", type: "dancer" },
      { orgSlug: "summit", role: "admin", type: "organizer" },
    ],
  } as const;

  it("sends an Organizer account from the feed, the default after sign-in, to its Org's admin area", () => {
    expect(organizerRedirect(organizerAccount, "/feed")).toEqual({
      to: "/o/$orgSlug/admin",
      params: { orgSlug: "summit" },
    });
  });

  it("sends an Organizer account away from dancer onboarding", () => {
    expect(organizerRedirect(organizerAccount, "/onboarding")).toEqual({
      to: "/o/$orgSlug/admin",
      params: { orgSlug: "summit" },
    });
  });

  it("lets an Organizer account open its own account pages and sign out", () => {
    for (const page of ["/settings/account", "/settings/password", "/logout"]) {
      expect(organizerRedirect(organizerAccount, page)).toBeNull();
    }
    expect(
      organizerRedirect(organizerAccount, "/settings/membership"),
    ).not.toBeNull();
  });

  it("sends an Organizer account with no Org left to its account page", () => {
    expect(
      organizerRedirect({ type: "organizer", orgMemberships: [] }, "/feed"),
    ).toEqual({ to: "/settings/account" });
    expect(
      organizerRedirect(
        { type: "organizer", orgMemberships: [] },
        "/settings/account",
      ),
    ).toBeNull();
  });

  it("leaves dancer and school accounts where they are", () => {
    for (const type of ["dancer", "school"] as const) {
      expect(
        organizerRedirect(
          { type, orgMemberships: organizerAccount.orgMemberships },
          "/feed",
        ),
      ).toBeNull();
    }
  });
});

describe("organizerOrgSlug", () => {
  it("is the first Org the account administers", () => {
    expect(
      organizerOrgSlug({
        type: "organizer",
        orgMemberships: [
          { orgSlug: "hoosier", role: "member", type: "coach" },
          { orgSlug: "summit", role: "member", type: "organizer" },
          { orgSlug: "other", role: "admin", type: "organizer" },
        ],
      }),
    ).toBe("summit");
  });
});
