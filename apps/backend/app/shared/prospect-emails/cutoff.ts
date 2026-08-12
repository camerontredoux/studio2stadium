import { DateTime } from "luxon";

export const PROSPECT_TZ = "America/Denver";

/**
 * The recruiting cycle boundary: the most recent August 1 at or before `now`.
 *
 * Submissions created before this instant are "early"; on or after it are
 * "new". Both the September and the January send of a given cycle resolve to
 * the same August 1, so a coach sees a consistent split across both emails.
 *
 * The old implementation hardcoded 2026-01-02 as the boundary while the job
 * fired at 2026-01-02T00:00 Denver (07:00Z), so "new" could only ever contain
 * a 7-hour sliver and in practice rendered empty.
 */
export function mostRecentAugustFirst(now: Date): Date {
  const local = DateTime.fromJSDate(now, { zone: PROSPECT_TZ });

  const augustThisYear = DateTime.fromObject(
    { year: local.year, month: 8, day: 1 },
    { zone: PROSPECT_TZ }
  ).startOf("day");

  const cutoff =
    local < augustThisYear ? augustThisYear.minus({ years: 1 }) : augustThisYear;

  return cutoff.toJSDate();
}
