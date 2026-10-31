// The viewer is in Los Angeles; events below are elsewhere. Phase must follow
// the event's zone, never the viewer's.
process.env.TZ = "America/Los_Angeles";

import { describe, expect, it } from "vitest";

import { computeEventPhase, type EventPhaseFields } from "./use-event-phase";

/** Three days, 10:00 to 16:00 each day, in Chicago (CST, UTC-6). */
const chicago: EventPhaseFields = {
  startDate: "2026-11-12",
  endDate: "2026-11-14",
  startTime: "10:00",
  endTime: "16:00",
  effectiveTimezone: "America/Chicago",
  startsAt: "2026-11-12T16:00:00.000Z",
  endsAt: "2026-11-14T22:00:00.000Z",
};

const at = (iso: string) => new Date(iso);

describe("computeEventPhase with daily hours", () => {
  it("is day 2 of 3 but not live before day 2's hours", () => {
    // 09:00 CST on day 2.
    const info = computeEventPhase(chicago, at("2026-11-13T15:00:00Z"));
    expect(info.phase).toBe("paused");
    expect(info.day).toBe(2);
    expect(info.label).toBe("Day 2 of 3");
    expect(info.nextStartLabel).toBe("Resumes 10:00");
    expect(info.hasStarted).toBe(true);
  });

  it("is live inside day 2's hours", () => {
    // 12:00 CST on day 2.
    const info = computeEventPhase(chicago, at("2026-11-13T18:00:00Z"));
    expect(info.phase).toBe("live");
    expect(info.day).toBe(2);
    expect(info.label).toBe("Day 2 of 3");
  });

  it("is not live after day 2's hours, and resumes tomorrow", () => {
    // 17:00 CST on day 2.
    const info = computeEventPhase(chicago, at("2026-11-13T23:00:00Z"));
    expect(info.phase).toBe("paused");
    expect(info.day).toBe(2);
    expect(info.nextStartLabel).toBe("Resumes tomorrow at 10:00");
    expect(info.hasStarted).toBe(true);
  });

  it("has ended a minute after day 3's end time", () => {
    // 16:01 CST on day 3.
    const info = computeEventPhase(chicago, at("2026-11-14T22:01:00Z"));
    expect(info.phase).toBe("wrapped");
    expect(info.day).toBeNull();
    expect(info.label).toBe("Just wrapped");
  });

  it("is day 1 but not started before the first day's start", () => {
    // 09:00 CST on day 1.
    const info = computeEventPhase(chicago, at("2026-11-12T15:00:00Z"));
    expect(info.phase).toBe("paused");
    expect(info.day).toBe(1);
    expect(info.daysUntilStart).toBe(0);
    expect(info.hasStarted).toBe(false);
    expect(info.nextStartLabel).toBe("Starts 10:00");
  });

  it("is imminent within a week and upcoming before that", () => {
    const imminent = computeEventPhase(chicago, at("2026-11-05T18:00:00Z"));
    expect(imminent.phase).toBe("imminent");
    expect(imminent.daysUntilStart).toBe(7);
    expect(imminent.label).toBe("7 days until event weekend");

    const upcoming = computeEventPhase(chicago, at("2026-10-01T18:00:00Z"));
    expect(upcoming.phase).toBe("upcoming");
  });

  it("counts days since the end", () => {
    const info = computeEventPhase(chicago, at("2026-11-17T18:00:00Z"));
    expect(info.label).toBe("Wrapped 3 days ago");
  });
});

describe("computeEventPhase reads the event's zone, not the viewer's", () => {
  /** 09:00 to 17:00 in New York (EDT, UTC-4); the viewer is in Los Angeles. */
  const newYork: EventPhaseFields = {
    startDate: "2026-10-22",
    endDate: "2026-10-24",
    startTime: "09:00",
    endTime: "17:00",
    effectiveTimezone: "America/New_York",
    startsAt: "2026-10-22T13:00:00.000Z",
    endsAt: "2026-10-24T21:00:00.000Z",
  };

  it("is live at 09:30 New York, which is 06:30 for the viewer", () => {
    const now = at("2026-10-22T13:30:00Z");
    expect(now.getHours()).toBe(6);
    const info = computeEventPhase(newYork, now);
    expect(info.phase).toBe("live");
    expect(info.day).toBe(1);
  });

  it("has ended at 18:30 New York, which is 15:30 for the viewer", () => {
    const now = at("2026-10-24T22:30:00Z");
    expect(now.getHours()).toBe(15);
    expect(computeEventPhase(newYork, now).phase).toBe("wrapped");
  });

  it("counts the day in New York when the viewer's date is a day behind", () => {
    // 00:30 on the 23rd in New York is 21:30 on the 22nd for the viewer.
    const info = computeEventPhase(newYork, at("2026-10-23T04:30:00Z"));
    expect(info.phase).toBe("paused");
    expect(info.day).toBe(2);
    expect(info.nextStartLabel).toBe("Resumes 09:00");
  });
});

describe("computeEventPhase across daylight saving", () => {
  // New York leaves daylight saving on Nov 1, 2026: day 1 is EDT, day 2 EST.
  const dst: EventPhaseFields = {
    startDate: "2026-10-31",
    endDate: "2026-11-01",
    startTime: "10:00",
    endTime: "16:00",
    effectiveTimezone: "America/New_York",
    startsAt: "2026-10-31T14:00:00.000Z",
    endsAt: "2026-11-01T21:00:00.000Z",
  };

  it("uses EST hours on day 2", () => {
    // 09:30 EST: before the hours, though it would be 10:30 in EDT.
    expect(computeEventPhase(dst, at("2026-11-01T14:30:00Z")).phase).toBe(
      "paused",
    );
    // 10:30 EST.
    expect(computeEventPhase(dst, at("2026-11-01T15:30:00Z")).phase).toBe(
      "live",
    );
    // 15:59 EST is still live; 16:00 EST is the end.
    expect(computeEventPhase(dst, at("2026-11-01T20:59:00Z")).phase).toBe(
      "live",
    );
    expect(computeEventPhase(dst, at("2026-11-01T21:00:00Z")).phase).toBe(
      "wrapped",
    );
  });
});

describe("computeEventPhase without hours", () => {
  const dateOnly: EventPhaseFields = {
    startDate: "2026-10-22",
    endDate: "2026-10-24",
    startTime: null,
    endTime: null,
    effectiveTimezone: "America/Chicago",
    startsAt: "2026-10-22T05:00:00.000Z",
    endsAt: "2026-10-25T05:00:00.000Z",
  };

  it("is live all day on each event day, in the event's zone", () => {
    // 00:30 CDT on day 1.
    const info = computeEventPhase(dateOnly, at("2026-10-22T05:30:00Z"));
    expect(info.phase).toBe("live");
    expect(info.day).toBe(1);
    // 23:59 CDT on day 3.
    expect(computeEventPhase(dateOnly, at("2026-10-25T04:59:00Z")).phase).toBe(
      "live",
    );
    expect(computeEventPhase(dateOnly, at("2026-10-25T05:00:00Z")).phase).toBe(
      "wrapped",
    );
  });

  it("doesn't throw on a row missing its times or instants", () => {
    const info = computeEventPhase(
      {
        ...dateOnly,
        endTime: undefined as unknown as null,
        startsAt: undefined as unknown as string,
        endsAt: "",
        effectiveTimezone: "",
      },
      at("2026-10-23T12:00:00Z"),
    );
    expect(info.phase).toBe("live");
    expect(info.hasStarted).toBe(false);
  });
});
