import { describe, expect, it } from "vitest";

import { dashboardRoster } from "./dashboard-roster";

const wrappedRoster = { id: "r-old", eventId: "e-wrapped" };
const activeRoster = { id: "r-active", eventId: "e-active" };

describe("dashboardRoster", () => {
  it("keeps a member on their own roster entry", () => {
    expect(
      dashboardRoster([wrappedRoster, activeRoster], {
        isAdmin: false,
        myRoster: wrappedRoster,
        activeEventId: "e-active",
      }),
    ).toBe(wrappedRoster);
  });

  it("previews staff on the active event, not an older staff roster entry", () => {
    expect(
      dashboardRoster([wrappedRoster], {
        isAdmin: true,
        myRoster: wrappedRoster,
        activeEventId: "e-active",
      }),
    ).toBeNull();
    expect(
      dashboardRoster([wrappedRoster, activeRoster], {
        isAdmin: true,
        myRoster: wrappedRoster,
        activeEventId: "e-active",
      }),
    ).toBe(activeRoster);
  });
});
