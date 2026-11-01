import { afterEach, describe, expect, it, vi } from "vitest";

import { eventDay } from "./event-day";

describe("eventDay", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the dancer's local day, not the UTC day", () => {
    vi.stubEnv("TZ", "America/New_York");
    // 02:00 UTC on Oct 30 is still the evening of Oct 29 in New York.
    expect(eventDay({ startDatetime: "2026-10-30T02:00:00.000Z" })).toBe(
      "2026-10-29",
    );
  });
});
