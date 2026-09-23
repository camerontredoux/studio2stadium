import { describe, expect, it } from "vitest";

import type { OrgEvent } from "@/features/org/api/admin-queries";
import { resolveAdminEventSelection } from "./admin-event-context";

function event(id: string, isActive = false): OrgEvent {
  return {
    id,
    orgId: "org-1",
    name: `Event ${id}`,
    startDate: "2026-07-13",
    endDate: "2026-07-14",
    startTime: null,
    timezone: null,
    venueName: null,
    venueAddress: null,
    contactEmail: null,
    schedulePdfUrl: null,
    isActive,
    eventTier: "enterprise",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

describe("resolveAdminEventSelection", () => {
  it("keeps a selected inactive event visible", () => {
    const events = [event("active", true), event("selected")];

    expect(resolveAdminEventSelection(events, "selected")?.id).toBe("selected");
    expect(events.find((item) => item.isActive)?.id).toBe("active");
  });

  it("defaults to the active event", () => {
    const events = [event("first"), event("active", true)];

    expect(resolveAdminEventSelection(events, null)?.id).toBe("active");
  });

  it("falls back when the selected event no longer exists", () => {
    const events = [event("active", true), event("other")];

    expect(resolveAdminEventSelection(events, "deleted")?.id).toBe("active");
  });

  it("still selects an event when the Org has no active one", () => {
    // A refunded or disputed purchase stands its event down and leaves the
    // Org with no active event (#91); the admin area keeps showing it.
    const events = [event("refunded"), event("older")];

    expect(resolveAdminEventSelection(events, null)?.id).toBe("refunded");
  });
});
