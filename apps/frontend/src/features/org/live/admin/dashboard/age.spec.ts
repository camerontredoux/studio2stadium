import { describe, expect, it } from "vitest";

import { agoLabel, relativeTime, shortAge } from "./age";

const now = new Date("2026-10-24T12:00:00Z");

describe("shortAge", () => {
  it("reads under a minute and future times as now", () => {
    expect(shortAge("2026-10-24T11:59:30Z", now)).toBe("now");
    expect(shortAge("2026-10-24T12:05:00Z", now)).toBe("now");
  });

  it("uses minutes, then hours, then days", () => {
    expect(shortAge("2026-10-24T11:48:00Z", now)).toBe("12m");
    expect(shortAge("2026-10-24T09:00:00Z", now)).toBe("3h");
    expect(shortAge("2026-10-22T11:00:00Z", now)).toBe("2d");
  });

  it("reads an unparseable value as now", () => {
    expect(shortAge("not a date", now)).toBe("now");
  });
});

describe("agoLabel", () => {
  it("adds ago except for now", () => {
    expect(agoLabel("2026-10-24T11:25:00Z", now)).toBe("35m ago");
    expect(agoLabel("2026-10-24T12:00:00Z", now)).toBe("just now");
  });
});

describe("relativeTime", () => {
  it("reads past times as ago", () => {
    expect(relativeTime("2026-10-24T09:00:00Z", now)).toBe("3h ago");
  });

  it("reads future times as in", () => {
    expect(relativeTime("2026-10-27T12:00:00Z", now)).toBe("in 3d");
    expect(relativeTime("2026-10-24T12:00:20Z", now)).toBe("in under a minute");
  });
});
