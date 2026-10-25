import { describe, expect, it } from "vitest";

import {
  daysBetweenYmd,
  formatClock,
  todayIn,
  zonedInstant,
  localDateFromYmd,
  normalizeTime,
  timeToMinutes,
  ymdParts,
} from "./event-clock";

describe("event-clock", () => {
  it("normalizes times and rejects anything that isn't one", () => {
    expect(normalizeTime("09:30:00")).toBe("09:30");
    expect(normalizeTime("9:05")).toBe("09:05");
    expect(normalizeTime("25:00")).toBeNull();
    for (const value of [null, undefined, "", "soon"]) {
      expect(normalizeTime(value)).toBeNull();
      expect(timeToMinutes(value)).toBeNull();
    }
    expect(timeToMinutes("10:30")).toBe(630);
  });

  it("reads dates without throwing on missing ones", () => {
    expect(ymdParts("2026-10-22")).toEqual([2026, 10, 22]);
    expect(ymdParts(undefined)).toBeNull();
    expect(ymdParts("")).toBeNull();
    expect(daysBetweenYmd("2026-10-22", "2026-10-24")).toBe(2);
    expect(daysBetweenYmd(null, "2026-10-24")).toBe(0);
    expect(localDateFromYmd("2026-10-22").getDate()).toBe(22);
    expect(localDateFromYmd(undefined)).toBeInstanceOf(Date);
  });

  it("turns event-zone wall times into instants across daylight saving", () => {
    expect(
      zonedInstant("2026-10-31", "10:00", "America/New_York")?.toISOString(),
    ).toBe("2026-10-31T14:00:00.000Z");
    expect(
      zonedInstant("2026-11-01", "10:00", "America/New_York")?.toISOString(),
    ).toBe("2026-11-01T15:00:00.000Z");
    expect(zonedInstant(undefined, "10:00", "America/New_York")).toBeNull();
  });

  it("formats an instant on the event's clock", () => {
    const instant = "2026-11-13T18:05:00.000Z";
    expect(formatClock(instant, "America/Chicago")).toBe("12:05");
    expect(formatClock(instant, "UTC")).toBe("18:05");
    expect(formatClock(null, "UTC")).toBe("");
    expect(formatClock("not a date", "UTC")).toBe("");
    expect(todayIn(new Date("2026-10-25T02:00:00Z"), "America/New_York")).toBe(
      "2026-10-24",
    );
  });
});
