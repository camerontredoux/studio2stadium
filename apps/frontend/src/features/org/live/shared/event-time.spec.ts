import { describe, expect, it } from "vitest";

import {
  eventDayInfo,
  eventYearLabel,
  formatRailDateRange,
  formatTimeLeft,
  formatTimeRange,
  normalizeTime,
  timeZoneAbbr,
} from "./event-time";

process.env.TZ = "America/Los_Angeles";

/** Oct 22-24 in Denver (MDT, UTC-6), from 12:00 each day with no end time. */
const event = {
  startDate: "2026-10-22",
  endDate: "2026-10-24",
  startTime: "12:00",
  endTime: null,
  timezone: "America/Denver",
  effectiveTimezone: "America/Denver",
  startsAt: "2026-10-22T18:00:00.000Z",
  endsAt: "2026-10-25T06:00:00.000Z",
};

/** A Denver wall-clock time as an instant. */
const denver = (day: number, hour: number, minute = 0) =>
  new Date(Date.UTC(2026, 9, day, hour + 6, minute));

describe("eventDayInfo", () => {
  it("reports the live day, labels and time left in the event's hours", () => {
    const info = eventDayInfo(event, denver(23, 15));
    expect(info.isLive).toBe(true);
    expect(info.dayTag).toBe("Live");
    expect(info.day).toBe(2);
    expect(info.days).toBe(3);
    expect(info.dayLabels).toEqual(["Thu 22", "Fri 23", "Sat 24"]);
    // 12:00 to the default 22:00 end: 3 of 10 hours gone.
    expect(info.todayPct).toBeCloseTo(30);
    expect(info.minutesLeftToday).toBe(420);
    expect(info.timeLeftLabel).toBe("7h left today");
    expect(info.statusLine).toBeNull();
  });

  it("is today, not live, before the first day's start time", () => {
    const info = eventDayInfo(event, denver(22, 9, 30));
    expect(info.isLive).toBe(false);
    expect(info.dayTag).toBe("Today");
    expect(info.day).toBe(1);
    expect(info.todayPct).toBe(0);
    expect(info.timeLeftLabel).toBe("Starts 12:00");
  });

  it("says the day is done after the default end while the hours run to midnight", () => {
    const info = eventDayInfo(event, denver(24, 23));
    expect(info.isLive).toBe(true);
    expect(info.day).toBe(3);
    expect(info.todayPct).toBe(100);
    expect(info.timeLeftLabel).toBe("Done for today");
  });

  it("uses the default start without a start time", () => {
    const info = eventDayInfo(
      { ...event, startTime: null, timezone: null },
      denver(22, 15),
    );
    expect(info.dayStart).toBe("08:00");
    expect(info.todayPct).toBeCloseTo(50);
  });

  it("says when the event starts and when it ended", () => {
    const before = eventDayInfo(event, denver(10, 10));
    expect(before.isLive).toBe(false);
    expect(before.dayTag).toBeNull();
    expect(before.statusLine).toBe("Starts Thu, Oct 22");
    expect(before.daysAway).toBe(12);
    expect(before.timeLeftLabel).toBeNull();

    const after = eventDayInfo(event, denver(26, 10));
    expect(after.phase).toBe("wrapped");
    expect(after.statusLine).toBe("Ended Sat, Oct 24");
    expect(after.daysAway).toBe(2);
  });

  it("reads now on the event's wall clock, not the viewer's", () => {
    // 02:00 UTC on the 25th is still 20:00 on the 24th in Denver, 19:00 for the viewer.
    const info = eventDayInfo(event, new Date(Date.UTC(2026, 9, 25, 2, 0)));
    expect(info.isLive).toBe(true);
    expect(info.day).toBe(3);
    expect(info.timeLeftLabel).toBe("2h left today");
  });
});

describe("eventDayInfo with daily hours", () => {
  /** Three days, 10:00 to 16:00 each day, in Chicago (CST, UTC-6). */
  const chicago = {
    startDate: "2026-11-12",
    endDate: "2026-11-14",
    startTime: "10:00",
    endTime: "16:00",
    timezone: "America/Chicago",
    effectiveTimezone: "America/Chicago",
    startsAt: "2026-11-12T16:00:00.000Z",
    endsAt: "2026-11-14T22:00:00.000Z",
  };
  const cst = (day: number, hour: number, minute = 0) =>
    new Date(Date.UTC(2026, 10, day, hour + 6, minute));

  it("uses the daily hours for the progress and time left", () => {
    const info = eventDayInfo(chicago, cst(13, 13));
    expect(info.dayStart).toBe("10:00");
    expect(info.dayEnd).toBe("16:00");
    expect(info.todayPct).toBeCloseTo(50);
    expect(info.timeLeftLabel).toBe("3h left today");
  });

  it("shows day 2 as paused before and after its hours", () => {
    const early = eventDayInfo(chicago, cst(13, 9));
    expect(early.isLive).toBe(false);
    expect(early.dayTag).toBe("Paused");
    expect(early.day).toBe(2);
    expect(early.todayPct).toBe(0);
    expect(early.timeLeftLabel).toBe("Resumes 10:00");

    const late = eventDayInfo(chicago, cst(13, 17));
    expect(late.dayTag).toBe("Paused");
    expect(late.todayPct).toBe(100);
    expect(late.timeLeftLabel).toBe("Resumes tomorrow at 10:00");
  });

  it("has ended right after the last day's end time", () => {
    const info = eventDayInfo(chicago, cst(14, 16, 1));
    expect(info.phase).toBe("wrapped");
    expect(info.dayTag).toBeNull();
    expect(info.statusLine).toBe("Ended Sat, Nov 14");
  });
});

describe("formatting", () => {
  it("formats rail dates", () => {
    expect(formatRailDateRange(event)).toBe("Thu, Oct 22 → Sat, Oct 24");
    expect(eventYearLabel(event)).toBe("2026");
    expect(
      eventYearLabel({ startDate: "2026-12-31", endDate: "2027-01-01" }),
    ).toBe("2026–2027");
  });

  it("formats times and the time left", () => {
    expect(normalizeTime("09:30:00")).toBe("09:30");
    expect(normalizeTime("25:00")).toBeNull();
    expect(normalizeTime(null)).toBeNull();
    expect(formatTimeRange("12:00", null)).toBe("12:00 → End time");
    expect(formatTimeLeft(200)).toBe("3h 20m left today");
    expect(formatTimeLeft(45)).toBe("45m left today");
  });

  it("names the time zone at the event's start date", () => {
    expect(
      timeZoneAbbr({ startDate: "2026-10-22", timezone: "America/Denver" }),
    ).toBe("MDT");
    expect(
      timeZoneAbbr({ startDate: "2026-12-22", timezone: "America/Denver" }),
    ).toBe("MST");
    expect(
      timeZoneAbbr({ startDate: "2026-10-22", timezone: null }),
    ).toBeNull();
    expect(
      timeZoneAbbr({ startDate: "2026-10-22", timezone: "Not/AZone" }),
    ).toBeNull();
  });

  it("doesn't throw on missing dates or times", () => {
    expect(eventYearLabel({ startDate: "", endDate: "" })).toBe("");
    expect(formatTimeRange(normalizeTime(null), normalizeTime(undefined))).toBe(
      "Start time → End time",
    );
    expect(
      timeZoneAbbr({
        startDate: undefined as unknown as string,
        timezone: "America/Denver",
      }),
    ).toBe("MST");
  });
});
