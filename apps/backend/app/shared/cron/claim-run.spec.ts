import { test } from "@japa/runner";
import { DateTime } from "luxon";
import { db } from "#database/connection";
import { cronJobRuns } from "#database/schema/cron";
import {
  cronRunKey,
  PROSPECT_DIGEST_JOB,
  PROSPECT_REMINDER_JOB,
  withCronClaim,
} from "./claim-run.ts";

function denver(iso: string): Date {
  return DateTime.fromISO(iso, { zone: "America/Denver" }).toJSDate();
}

test.group("cronRunKey", () => {
  test("midnight Denver resolves to that date", async ({ assert }) => {
    assert.equal(cronRunKey(denver("2026-09-01T00:00:00")), "2026-09-01");
  });

  test("09:00 Denver resolves to that date", async ({ assert }) => {
    assert.equal(cronRunKey(denver("2027-01-02T09:00:00")), "2027-01-02");
  });

  test("a machine one second early derives the same key", async ({ assert }) => {
    assert.equal(cronRunKey(denver("2026-08-31T23:59:59")), "2026-09-01");
  });

  test("a machine one second late derives the same key", async ({ assert }) => {
    assert.equal(cronRunKey(denver("2026-09-01T00:00:01")), "2026-09-01");
  });
});

test.group("withCronClaim", (group) => {
  group.each.setup(async () => {
    await db.delete(cronJobRuns).execute();
  });

  test("runs the callback and returns its value", async ({ assert }) => {
    const result = await withCronClaim(PROSPECT_REMINDER_JOB, "2026-09-01", async () => "ran");
    assert.equal(result, "ran");
  });

  test("a second claim on the same tick returns null and skips the callback", async ({
    assert,
  }) => {
    let secondRan = false;

    await withCronClaim(PROSPECT_REMINDER_JOB, "2026-09-01", async () => "first");
    const second = await withCronClaim(PROSPECT_REMINDER_JOB, "2026-09-01", async () => {
      secondRan = true;
      return "second";
    });

    assert.isNull(second);
    assert.isFalse(secondRan);
  });

  test("a different run key claims independently", async ({ assert }) => {
    await withCronClaim(PROSPECT_REMINDER_JOB, "2026-09-01", async () => "first");
    const next = await withCronClaim(PROSPECT_REMINDER_JOB, "2026-10-01", async () => "next");
    assert.equal(next, "next");
  });

  test("a different job with the same run key claims independently", async ({ assert }) => {
    await withCronClaim(PROSPECT_REMINDER_JOB, "2027-01-02", async () => "reminder");
    const digest = await withCronClaim(PROSPECT_DIGEST_JOB, "2027-01-02", async () => "digest");
    assert.equal(digest, "digest");
  });

  test("keeps the claim when the callback throws", async ({ assert }) => {
    await assert.rejects(() =>
      withCronClaim(PROSPECT_REMINDER_JOB, "2026-09-01", async () => {
        throw new Error("boom");
      })
    );

    let retried = false;
    const again = await withCronClaim(PROSPECT_REMINDER_JOB, "2026-09-01", async () => {
      retried = true;
      return "again";
    });

    assert.isNull(again);
    assert.isFalse(retried);
  });
});
