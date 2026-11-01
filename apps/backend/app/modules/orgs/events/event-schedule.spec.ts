import { test } from "@japa/runner";
import type { EventSchedule } from "#utils/event-time";
import { assertEventSchedule, EventScheduleError } from "./event-schedule.ts";

const schedule = (overrides: Partial<EventSchedule> = {}): EventSchedule => ({
  startDate: "2026-10-22",
  endDate: "2026-10-24",
  startTime: "10:00",
  endTime: "16:00",
  timezone: "America/Chicago",
  ...overrides,
});

test.group("assertEventSchedule", () => {
  test("accepts daily hours, a start time without an end time, and a date-only event", ({
    assert,
  }) => {
    assert.doesNotThrow(() => assertEventSchedule(schedule()));
    assert.doesNotThrow(() => assertEventSchedule(schedule({ endTime: null })));
    assert.doesNotThrow(() =>
      assertEventSchedule(
        schedule({ startTime: null, endTime: null, timezone: null })
      )
    );
  });

  const rejected: [string, Partial<EventSchedule>, RegExp][] = [
    [
      "an end time before the start on a single-day event",
      { endDate: "2026-10-22", startTime: "16:00", endTime: "10:00" },
      /after the start time/,
    ],
    [
      "an end time equal to the start on a multi-day event (no overnight hours)",
      { startTime: "10:00", endTime: "10:00" },
      /after the start time/,
    ],
    [
      "an end time without a start time",
      { startTime: null, timezone: null },
      /needs a start time/,
    ],
    [
      "a start time without a zone",
      { endTime: null, timezone: null },
      /together/,
    ],
    [
      "an end date before the start date",
      { endDate: "2026-10-21" },
      /before the start/,
    ],
    ["a date that doesn't exist", { startDate: "2026-02-30" }, /real date/],
    ["an unknown zone", { timezone: "Not/A_Zone" }, /IANA/],
  ];

  for (const [name, overrides, message] of rejected) {
    test(`rejects ${name}`, ({ assert }) => {
      assert.throws(() => assertEventSchedule(schedule(overrides)), message);
      try {
        assertEventSchedule(schedule(overrides));
      } catch (err) {
        assert.instanceOf(err, EventScheduleError);
      }
    });
  }
});
