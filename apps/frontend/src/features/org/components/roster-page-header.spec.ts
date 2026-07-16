import { describe, expect, it } from "vitest";

import { ROSTER_HEADER_ACTIONS_CLASS_NAME } from "./roster-page-header";

describe("RosterPageHeader", () => {
  it("wraps the reset action onto its own line on mobile instead of overflowing", () => {
    expect(ROSTER_HEADER_ACTIONS_CLASS_NAME).toContain("flex-wrap");
    // Row gap only matters once the button has wrapped below the widget.
    expect(ROSTER_HEADER_ACTIONS_CLASS_NAME).toContain("gap-y-2");
  });

  it("keeps the activation widget and reset action aligned on one row", () => {
    expect(ROSTER_HEADER_ACTIONS_CLASS_NAME).toContain("items-center");
    expect(ROSTER_HEADER_ACTIONS_CLASS_NAME).toContain("gap-x-3");
  });
});
