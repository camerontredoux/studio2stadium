import { DateTime } from "luxon";

export interface PassTimes {
  id: string;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}

export interface PassRun {
  startsAt: Date;
  endsAt: Date;
  passes: PassTimes[];
}

/**
 * Group a Dancer's passes into uninterrupted runs of access: a pass joins the
 * run when it starts no later than the run's current end. A refunded pass
 * keeps its place (its `endsAt` was cut back, possibly to its start), so the
 * run it belonged to still shows that a refund touched it.
 */
export function passRuns(passes: PassTimes[]): PassRun[] {
  const sorted = [...passes].sort(
    (a, b) =>
      a.startsAt.getTime() - b.startsAt.getTime() ||
      a.endsAt.getTime() - b.endsAt.getTime()
  );
  const runs: PassRun[] = [];
  for (const pass of sorted) {
    const current = runs.at(-1);
    if (current && pass.startsAt <= current.endsAt) {
      current.passes.push(pass);
      if (pass.endsAt > current.endsAt) current.endsAt = pass.endsAt;
    } else {
      runs.push({
        startsAt: pass.startsAt,
        endsAt: pass.endsAt,
        passes: [pass],
      });
    }
  }
  return runs;
}

export function runContaining(
  passes: PassTimes[],
  passId: string
): PassRun | null {
  return (
    passRuns(passes).find((run) => run.passes.some((p) => p.id === passId)) ??
    null
  );
}

/**
 * A pass bought while access was running starts when that access ends, later
 * than its purchase. A minute of slack covers the time between reading the
 * clock for `startsAt` and the row's `createdAt` default.
 */
const QUEUED_SLACK_MS = 60_000;

export function welcomeVariant(pass: {
  startsAt: Date;
  createdAt: Date;
}): "current" | "queued" {
  return pass.startsAt.getTime() - pass.createdAt.getTime() > QUEUED_SLACK_MS
    ? "queued"
    : "current";
}

/**
 * "Monday, November 23, 2026 at 3:04 PM MST": always with the zone, so a
 * reader elsewhere can tell when that is. The abbreviation follows daylight
 * saving (MST/MDT).
 */
export function formatEmailDate(date: Date, zone: string): string {
  return DateTime.fromJSDate(date, { zone })
    .setLocale("en-US")
    .toFormat("cccc, LLLL d, yyyy 'at' h:mm a ZZZZ");
}
