import { db } from "#database/connection";
import { cronJobRuns } from "#database/schema/cron";
import { DateTime } from "luxon";

export const PROSPECT_REMINDER_JOB = "prospect-reminder";
export const PROSPECT_DIGEST_JOB = "prospect-digest";

const CRON_TZ = "America/Denver";

/**
 * A tick identifier that every machine firing the same tick agrees on.
 *
 * Machine clocks drift, and the reminder fires at exactly midnight Denver — a
 * machine a second early would otherwise derive the previous day's key, find it
 * already claimed from last month, and skip. Rounding to the nearest Denver
 * midnight absorbs up to twelve hours of skew.
 *
 * This assumes jobs using it are not scheduled near noon. Both prospect jobs
 * fire at 00:00 and 09:00.
 */
export function cronRunKey(now: Date, zone: string = CRON_TZ): string {
  const local = DateTime.fromJSDate(now, { zone });

  const nearestMidnight =
    local.hour < 12
      ? local.startOf("day")
      : local.startOf("day").plus({ days: 1 });

  return nearestMidnight.toISODate()!;
}

/**
 * Run `fn` only on the machine that claims this tick; return null on the others.
 *
 * The insert is a single atomic statement, so it is correct under the
 * transaction-mode connection pooler that a session-level advisory lock is not.
 *
 * The claim is committed before `fn` runs and is never rolled back on failure:
 * a crash mid-send does not release the tick to another machine. Duplicate mail
 * to every coach is worse than a missed send, and a missed send can be replayed
 * with `node ace send:prospect-emails`.
 */
export async function withCronClaim<T>(
  job: string,
  runKey: string,
  fn: () => Promise<T>
): Promise<T | null> {
  const claimed = await db
    .insert(cronJobRuns)
    .values({ job, runKey })
    .onConflictDoNothing()
    .returning({ id: cronJobRuns.id });

  if (claimed.length === 0) {
    return null;
  }

  return await fn();
}
