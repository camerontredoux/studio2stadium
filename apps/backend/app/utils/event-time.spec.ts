import { test } from "@japa/runner";
import {
  checkInOpensAt,
  eventDayWindow,
  eventInstants,
  eventStartsAt,
  hasEventStarted,
  isCheckInOpen,
  resolveEventZone,
  tierExpiryFrom,
  todayInZone,
  type EventSchedule,
} from "./event-time.ts";

const event = (overrides: Partial<EventSchedule> = {}): EventSchedule => ({
  startDate: "2026-07-15",
  endDate: "2026-07-15",
  startTime: null,
  endTime: null,
  timezone: null,
  ...overrides,
});

test.group("eventStartsAt", () => {
  const cases = [
    [
      "America/New_York",
      "2026-01-15T14:00:00.000Z",
      "2026-07-15T13:00:00.000Z",
    ],
    ["UTC", "2026-01-15T09:00:00.000Z", "2026-07-15T09:00:00.000Z"],
    ["Asia/Kolkata", "2026-01-15T03:30:00.000Z", "2026-07-15T03:30:00.000Z"],
  ] as const;

  for (const [timezone, januaryUtc, julyUtc] of cases) {
    test(`reads 09:00 in ${timezone} as the right UTC instant in both DST seasons`, ({
      assert,
    }) => {
      const at = (date: string) =>
        eventStartsAt(
          event({
            startDate: date,
            endDate: date,
            startTime: "09:00",
            timezone,
          })
        ).toISOString();
      assert.equal(at("2026-01-15"), januaryUtc);
      assert.equal(at("2026-07-15"), julyUtc);
    });
  }

  test("a start time inside the spring-forward gap moves to the first real minute", ({
    assert,
  }) => {
    // 2026-03-08 02:30 doesn't exist in New York; clocks jump to 03:00 EDT.
    const startsAt = eventStartsAt(
      event({
        startDate: "2026-03-08",
        endDate: "2026-03-08",
        startTime: "02:30",
        timezone: "America/New_York",
      })
    );
    assert.equal(startsAt.toISOString(), "2026-03-08T07:30:00.000Z");
  });
});

test.group("resolveEventZone", () => {
  test("uses the event zone, then the org default, then UTC", ({ assert }) => {
    assert.equal(
      resolveEventZone("America/Denver", "America/Chicago"),
      "America/Denver"
    );
    assert.equal(resolveEventZone(null, "America/Chicago"), "America/Chicago");
    assert.equal(resolveEventZone("Not/A_Zone", "Also/Bad"), "UTC");
  });
});

test.group("eventInstants", () => {
  test("a date-only event runs from 00:00 on its first day to 00:00 after its last, in the org zone", ({
    assert,
  }) => {
    const instants = eventInstants(
      event({ startDate: "2026-07-15", endDate: "2026-07-16" }),
      "America/Chicago"
    );
    assert.deepEqual(instants, {
      startsAt: "2026-07-15T05:00:00.000Z",
      endsAt: "2026-07-17T05:00:00.000Z",
      effectiveTimezone: "America/Chicago",
    });
  });

  test("the daily hours apply to every day, across the fall-back change", ({
    assert,
  }) => {
    // New York leaves daylight time at 02:00 on 2026-11-01.
    const daily = event({
      startDate: "2026-10-31",
      endDate: "2026-11-02",
      startTime: "10:00",
      endTime: "16:00",
      timezone: "America/New_York",
    });
    const day = (n: number) => {
      const w = eventDayWindow(daily, n);
      return [w.date, w.start.toISOString(), w.end.toISOString()];
    };
    assert.deepEqual(day(1), [
      "2026-10-31",
      "2026-10-31T14:00:00.000Z",
      "2026-10-31T20:00:00.000Z",
    ]);
    assert.deepEqual(day(2), [
      "2026-11-01",
      "2026-11-01T15:00:00.000Z",
      "2026-11-01T21:00:00.000Z",
    ]);
    assert.deepEqual(eventInstants(daily), {
      startsAt: "2026-10-31T14:00:00.000Z",
      endsAt: "2026-11-02T21:00:00.000Z",
      effectiveTimezone: "America/New_York",
    });
  });
});

test.group("hasEventStarted", () => {
  test("stays true between the days of a 3-day 10:00-16:00 event in Chicago", ({
    assert,
  }) => {
    const summit = event({
      startDate: "2026-10-22",
      endDate: "2026-10-24",
      startTime: "10:00",
      endTime: "16:00",
      timezone: "America/Chicago",
    });
    // Day 1, 09:59 and 10:00 CDT.
    assert.isFalse(
      hasEventStarted(summit, null, Date.parse("2026-10-22T14:59:00Z"))
    );
    assert.isTrue(
      hasEventStarted(summit, null, Date.parse("2026-10-22T15:00:00Z"))
    );
    // Day 2, 09:00 CDT: outside the day's hours but already under way.
    assert.isTrue(
      hasEventStarted(summit, null, Date.parse("2026-10-23T14:00:00Z"))
    );
  });
});

test.group("isCheckInOpen", () => {
  test("opens one hour before the first day's start time", ({ assert }) => {
    const timed = event({ startTime: "09:00", timezone: "America/New_York" });
    assert.isFalse(
      isCheckInOpen(timed, null, Date.parse("2026-07-15T11:59:59.999Z"))
    );
    assert.isTrue(
      isCheckInOpen(timed, null, Date.parse("2026-07-15T12:00:00Z"))
    );
  });

  test("a date-only event in Chicago opens at local midnight, not the evening before", ({
    assert,
  }) => {
    const dateOnly = event({ startDate: "2026-07-15", endDate: "2026-07-16" });
    assert.equal(
      checkInOpensAt(dateOnly, "America/Chicago").toISOString(),
      "2026-07-15T05:00:00.000Z"
    );
    // 2026-07-14 19:00 CDT is midnight UTC, where a UTC server used to open it.
    assert.isFalse(
      isCheckInOpen(
        dateOnly,
        "America/Chicago",
        Date.parse("2026-07-15T00:00:00Z")
      )
    );
    assert.isTrue(
      isCheckInOpen(
        dateOnly,
        "America/Chicago",
        Date.parse("2026-07-15T05:00:00Z")
      )
    );
  });
});

test.group("todayInZone", () => {
  test("is the zone's calendar date, not UTC's", ({ assert }) => {
    const now = Date.parse("2026-07-15T03:00:00Z");
    assert.equal(todayInZone("America/Chicago", now), "2026-07-14");
    assert.equal(todayInZone("UTC", now), "2026-07-15");
  });
});

test.group("tierExpiryFrom", () => {
  test("adds calendar months at 00:00 UTC, as a UTC server's setMonth did", ({
    assert,
  }) => {
    assert.equal(
      tierExpiryFrom("2026-06-14", 3).toISOString(),
      "2026-09-14T00:00:00.000Z"
    );
    assert.equal(
      tierExpiryFrom("2026-11-30", 3).toISOString(),
      "2027-03-02T00:00:00.000Z"
    );
  });
});
