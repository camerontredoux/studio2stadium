import { test } from "@japa/runner";
import {
  hasEventStarted,
  isCheckInOpen,
  toEventStartUtc,
} from "./event-time.ts";

test.group("toEventStartUtc", () => {
  const cases = [
    [
      "America/New_York",
      "2026-01-15T14:00:00.000Z",
      "2026-07-15T13:00:00.000Z",
    ],
    ["America/Chicago", "2026-01-15T15:00:00.000Z", "2026-07-15T14:00:00.000Z"],
    [
      "America/Los_Angeles",
      "2026-01-15T17:00:00.000Z",
      "2026-07-15T16:00:00.000Z",
    ],
    ["UTC", "2026-01-15T09:00:00.000Z", "2026-07-15T09:00:00.000Z"],
    ["Asia/Kolkata", "2026-01-15T03:30:00.000Z", "2026-07-15T03:30:00.000Z"],
  ] as const;

  for (const [timezone, januaryUtc, julyUtc] of cases) {
    test(`converts ${timezone} to exact UTC instants across DST seasons`, ({
      assert,
    }) => {
      assert.equal(
        toEventStartUtc("2026-01-15", "09:00", timezone).toISOString(),
        januaryUtc
      );
      assert.equal(
        toEventStartUtc("2026-07-15", "09:00", timezone).toISOString(),
        julyUtc
      );
    });
  }

  test("falls back to the date-only behavior for an invalid timezone", ({
    assert,
  }) => {
    assert.equal(
      toEventStartUtc("2026-07-15", "09:00", "Not/A_Timezone").getTime(),
      new Date(2026, 6, 15).getTime()
    );
  });
});

test.group("hasEventStarted", () => {
  test("falls back to date check when startTime is null (past date)", ({
    assert,
  }) => {
    assert.isTrue(hasEventStarted("2020-01-01", null, null));
  });

  test("falls back to date check when startTime is null (future date)", ({
    assert,
  }) => {
    assert.isFalse(hasEventStarted("2099-12-31", null, null));
  });

  test("falls back to date check when timezone is null", ({ assert }) => {
    assert.isTrue(hasEventStarted("2020-01-01", "09:00", null));
  });

  test("returns true for a past event start", ({ assert }) => {
    assert.isTrue(hasEventStarted("2020-01-01", "09:00", "America/New_York"));
  });

  test("returns false for a future event start", ({ assert }) => {
    assert.isFalse(hasEventStarted("2099-12-31", "23:59", "America/New_York"));
  });

  test("uses the timezone-correct event instant", ({ assert }) => {
    const originalNow = Date.now;
    Date.now = () => Date.parse("2026-07-15T12:59:59.999Z");

    try {
      assert.isFalse(
        hasEventStarted("2026-07-15", "09:00", "America/New_York")
      );
      Date.now = () => Date.parse("2026-07-15T13:00:00.000Z");
      assert.isTrue(hasEventStarted("2026-07-15", "09:00", "America/New_York"));
    } finally {
      Date.now = originalNow;
    }
  });
});

test.group("isCheckInOpen", () => {
  test("opens exactly one hour before the timezone-correct event instant", ({
    assert,
  }) => {
    const originalNow = Date.now;
    Date.now = () => Date.parse("2026-07-15T11:59:59.999Z");

    try {
      assert.isFalse(isCheckInOpen("2026-07-15", "09:00", "America/New_York"));
      Date.now = () => Date.parse("2026-07-15T12:00:00.000Z");
      assert.isTrue(isCheckInOpen("2026-07-15", "09:00", "America/New_York"));
    } finally {
      Date.now = originalNow;
    }
  });

  test("keeps the date-only fallback when timezone is missing", ({
    assert,
  }) => {
    const originalNow = Date.now;
    const startOfDay = new Date(2026, 6, 15).getTime();
    Date.now = () => startOfDay - 60 * 60 * 1000;

    try {
      assert.isTrue(isCheckInOpen("2026-07-15", "09:00", null));
    } finally {
      Date.now = originalNow;
    }
  });
});
