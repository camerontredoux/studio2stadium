import { test } from "@japa/runner";
import {
  formatEmailDate,
  passRuns,
  runContaining,
  welcomeVariant,
  type PassTimes,
} from "./schedule.ts";

const DAY = 86_400_000;
const pass = (
  id: string,
  startsAt: string,
  days: number,
  extra: Partial<PassTimes> = {}
): PassTimes => {
  const start = new Date(startsAt);
  return {
    id,
    startsAt: start,
    endsAt: new Date(start.getTime() + days * DAY),
    createdAt: start,
    revokedAt: null,
    ...extra,
  };
};

test.group("Week Pass email dates", () => {
  test("always print the zone, following daylight saving", ({ assert }) => {
    assert.equal(
      formatEmailDate(new Date("2026-01-15T17:15:00Z"), "America/Denver"),
      "Thursday, January 15, 2026 at 10:15 AM MST"
    );
    assert.equal(
      formatEmailDate(new Date("2026-07-15T16:15:00Z"), "America/Denver"),
      "Wednesday, July 15, 2026 at 10:15 AM MDT"
    );
    assert.equal(
      formatEmailDate(new Date("2026-01-15T17:15:00Z"), "America/New_York"),
      "Thursday, January 15, 2026 at 12:15 PM EST"
    );
  });

  test("a pass across the spring change is seven real days, so its local end moves an hour", ({
    assert,
  }) => {
    // DST starts 2026-03-08 02:00 in Denver.
    const p = pass("a", "2026-03-05T17:15:00Z", 7);
    assert.equal(
      formatEmailDate(p.startsAt, "America/Denver"),
      "Thursday, March 5, 2026 at 10:15 AM MST"
    );
    assert.equal(
      formatEmailDate(p.endsAt, "America/Denver"),
      "Thursday, March 12, 2026 at 11:15 AM MDT"
    );
  });

  test("a pass across the autumn change ends an hour earlier on the clock", ({
    assert,
  }) => {
    // DST ends 2026-11-01 02:00 in Denver.
    const p = pass("a", "2026-10-29T16:15:00Z", 7);
    assert.equal(
      formatEmailDate(p.endsAt, "America/Denver"),
      "Thursday, November 5, 2026 at 9:15 AM MST"
    );
  });
});

test.group("Week Pass runs", () => {
  test("back-to-back passes are one run; a gap starts another", ({
    assert,
  }) => {
    const a = pass("a", "2026-03-01T00:00:00Z", 7);
    const b = pass("b", "2026-03-08T00:00:00Z", 7);
    const c = pass("c", "2026-04-01T00:00:00Z", 7);

    const runs = passRuns([c, b, a]);
    assert.lengthOf(runs, 2);
    assert.deepEqual(
      runs[0]!.passes.map((p) => p.id),
      ["a", "b"]
    );
    assert.equal(runs[0]!.endsAt.toISOString(), "2026-03-15T00:00:00.000Z");
    assert.equal(
      runContaining([a, b, c], "a")!.endsAt.toISOString(),
      "2026-03-15T00:00:00.000Z"
    );
  });

  test("a refunded queued pass stays in its run, so the run shows the refund", ({
    assert,
  }) => {
    const a = pass("a", "2026-03-01T00:00:00Z", 7);
    const refunded = pass("r", "2026-03-08T00:00:00Z", 0, {
      revokedAt: new Date("2026-03-03T00:00:00Z"),
    });
    const run = runContaining([a, refunded], "a")!;
    assert.isTrue(run.passes.some((p) => p.revokedAt));
    assert.equal(run.endsAt.toISOString(), "2026-03-08T00:00:00.000Z");
  });

  test("a pass is queued only when it starts well after it was bought", ({
    assert,
  }) => {
    const now = new Date("2026-03-01T00:00:00Z");
    assert.equal(welcomeVariant({ startsAt: now, createdAt: now }), "current");
    assert.equal(
      welcomeVariant({
        startsAt: new Date(now.getTime() + 30_000),
        createdAt: now,
      }),
      "current"
    );
    assert.equal(
      welcomeVariant({
        startsAt: new Date(now.getTime() + 2 * DAY),
        createdAt: now,
      }),
      "queued"
    );
  });
});
