import { test } from "@japa/runner";
import { hasEventStarted, toEventStartUtc } from "./event-time.ts";

test.group("toEventStartUtc", () => {
  test("converts Eastern time to correct UTC", ({ assert }) => {
    const utc = toEventStartUtc("2026-06-15", "09:00", "America/New_York");
    assert.equal(utc.toISOString(), "2026-06-15T13:00:00.000Z");
  });

  test("converts Central time to correct UTC", ({ assert }) => {
    const utc = toEventStartUtc("2026-06-15", "09:00", "America/Chicago");
    assert.equal(utc.toISOString(), "2026-06-15T14:00:00.000Z");
  });

  test("converts Pacific time to correct UTC", ({ assert }) => {
    const utc = toEventStartUtc("2026-06-15", "09:00", "America/Los_Angeles");
    assert.equal(utc.toISOString(), "2026-06-15T16:00:00.000Z");
  });
});

test.group("hasEventStarted", () => {
  test("returns false when startTime is null", ({ assert }) => {
    assert.isFalse(hasEventStarted("2020-01-01", null, null));
  });

  test("returns false when timezone is null", ({ assert }) => {
    assert.isFalse(hasEventStarted("2020-01-01", "09:00", null));
  });

  test("returns true for a past event start", ({ assert }) => {
    assert.isTrue(hasEventStarted("2020-01-01", "09:00", "America/New_York"));
  });

  test("returns false for a future event start", ({ assert }) => {
    assert.isFalse(hasEventStarted("2099-12-31", "23:59", "America/New_York"));
  });
});
