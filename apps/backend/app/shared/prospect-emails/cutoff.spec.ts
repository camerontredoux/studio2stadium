import { test } from "@japa/runner";
import { DateTime } from "luxon";
import {
  graduatingClass,
  mostRecentAugustFirst,
  PROSPECT_TZ,
} from "./cutoff.ts";

function denver(iso: string): Date {
  return DateTime.fromISO(iso, { zone: PROSPECT_TZ }).toJSDate();
}

test.group("mostRecentAugustFirst", () => {
  test("September 1 2026 run resolves to August 1 2026", async ({ assert }) => {
    const cutoff = mostRecentAugustFirst(denver("2026-09-01T09:00:00"));
    assert.equal(
      DateTime.fromJSDate(cutoff, { zone: PROSPECT_TZ }).toISODate(),
      "2026-08-01"
    );
  });

  test("January 2 2027 run resolves back to August 1 2026", async ({
    assert,
  }) => {
    const cutoff = mostRecentAugustFirst(denver("2027-01-02T09:00:00"));
    assert.equal(
      DateTime.fromJSDate(cutoff, { zone: PROSPECT_TZ }).toISODate(),
      "2026-08-01"
    );
  });

  test("both sends in one cycle share the same cutoff", async ({ assert }) => {
    const sept = mostRecentAugustFirst(denver("2026-09-01T09:00:00"));
    const jan = mostRecentAugustFirst(denver("2027-01-02T09:00:00"));
    assert.equal(sept.getTime(), jan.getTime());
  });

  test("exactly August 1 midnight counts as the current cycle", async ({
    assert,
  }) => {
    const cutoff = mostRecentAugustFirst(denver("2026-08-01T00:00:00"));
    assert.equal(
      DateTime.fromJSDate(cutoff, { zone: PROSPECT_TZ }).toISODate(),
      "2026-08-01"
    );
  });

  test("July 31 falls back to the previous August", async ({ assert }) => {
    const cutoff = mostRecentAugustFirst(denver("2026-07-31T23:59:00"));
    assert.equal(
      DateTime.fromJSDate(cutoff, { zone: PROSPECT_TZ }).toISODate(),
      "2025-08-01"
    );
  });

  test("cutoff is midnight Denver, not midnight UTC", async ({ assert }) => {
    const cutoff = mostRecentAugustFirst(denver("2026-09-01T09:00:00"));
    const local = DateTime.fromJSDate(cutoff, { zone: PROSPECT_TZ });
    assert.equal(local.hour, 0);
    assert.equal(local.minute, 0);
  });
});

test.group("graduatingClass", () => {
  test("spring of a year is that year's class", async ({ assert }) => {
    assert.equal(graduatingClass(denver("2027-05-15T12:00:00")), 2027);
  });

  test("fall of a year is the next year's class", async ({ assert }) => {
    assert.equal(graduatingClass(denver("2026-10-12T12:00:00")), 2027);
    assert.equal(graduatingClass(denver("2027-09-01T12:00:00")), 2028);
  });

  test("rolls over at August 1 midnight Denver", async ({ assert }) => {
    assert.equal(graduatingClass(denver("2027-07-31T23:59:00")), 2027);
    assert.equal(graduatingClass(denver("2027-08-01T00:00:00")), 2028);
  });
});
