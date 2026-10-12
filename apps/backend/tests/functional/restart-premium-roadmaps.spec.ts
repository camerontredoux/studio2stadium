import { db } from "#database/connection";
import { premiumRoadmaps } from "#database/schema/subscriptions";
import { users } from "#database/schema/users";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";
import { createDancer, DAY_MS, subscribe } from "#tests/helpers/premium";
import { restartPremiumRoadmaps } from "../../commands/restart-premium-roadmaps.ts";

test.group("restart:premium-roadmaps", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  test("starts every current Premium dancer's 30 days at the given time, once", async ({
    assert,
  }) => {
    const now = new Date();
    const startsAt = new Date(now.getTime() - DAY_MS);
    const longAgo = new Date(now.getTime() - 90 * DAY_MS);

    const withoutRoadmap = await createDancer();
    await subscribe(withoutRoadmap.id, { startedAt: longAgo });

    const withRoadmap = await createDancer();
    await subscribe(withRoadmap.id, { startedAt: longAgo });
    await db.insert(premiumRoadmaps).values({
      userId: withRoadmap.id,
      roadmapVersion: 1,
      premiumStartedAt: longAgo,
      firstViewedAt: longAgo,
      profileCompletedAt: longAgo,
      trackerCompletedAt: longAgo,
    });

    // Subscribed after startsAt, so keeps their own later start.
    const joinedSince = await createDancer();
    const joinedAt = new Date(now.getTime() - DAY_MS / 2);
    await subscribe(joinedSince.id, { startedAt: joinedAt });

    const canceled = await createDancer();
    await subscribe(canceled.id, { startedAt: longAgo, status: "canceled" });

    const first = await restartPremiumRoadmaps(startsAt, now);
    assert.deepEqual(first, {
      members: 3,
      roadmapsCreated: 2,
      roadmapsRestarted: 1,
    });

    const rows = await db.select().from(premiumRoadmaps);
    const roadmaps = new Map(rows.map((r) => [r.userId, r]));
    assert.lengthOf([...roadmaps.keys()], 3);
    assert.isFalse(roadmaps.has(canceled.id));
    assert.equal(
      roadmaps.get(withoutRoadmap.id)!.premiumStartedAt.getTime(),
      startsAt.getTime()
    );
    assert.equal(
      roadmaps.get(joinedSince.id)!.premiumStartedAt.getTime(),
      joinedAt.getTime()
    );

    const restarted = roadmaps.get(withRoadmap.id)!;
    assert.equal(restarted.premiumStartedAt.getTime(), startsAt.getTime());
    assert.equal(restarted.firstViewedAt?.getTime(), longAgo.getTime());
    assert.equal(restarted.profileCompletedAt?.getTime(), longAgo.getTime());
    assert.equal(restarted.trackerCompletedAt?.getTime(), longAgo.getTime());

    const again = await restartPremiumRoadmaps(startsAt, now);
    assert.deepEqual(again, {
      members: 3,
      roadmapsCreated: 0,
      roadmapsRestarted: 0,
    });

    // An earlier start never moves a roadmap back.
    const earlier = await restartPremiumRoadmaps(longAgo, now);
    assert.equal(earlier.roadmapsRestarted, 0);
  });
});
