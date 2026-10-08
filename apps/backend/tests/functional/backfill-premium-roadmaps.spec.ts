import { db } from "#database/connection";
import { premiumRoadmaps, subscriptions } from "#database/schema/subscriptions";
import { users } from "#database/schema/users";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
import { createDancer, DAY_MS, subscribe } from "#tests/helpers/premium";
import { backfillPremiumRoadmaps } from "../../commands/backfill-premium-roadmaps.ts";

test.group("backfill:premium-roadmaps", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  test("fills start dates from Stripe and creates roadmaps only inside the first 30 days, once", async ({
    assert,
  }) => {
    const recent = await createDancer();
    const old = await createDancer();
    await subscribe(recent.id, { startedAt: null });
    await subscribe(old.id, { startedAt: null });

    const starts = new Map([
      [recent.id, new Date(Date.now() - 3 * DAY_MS)],
      [old.id, new Date(Date.now() - 90 * DAY_MS)],
    ]);
    const rows = await db.select().from(subscriptions);
    const subscriptionUser = new Map(
      rows.map((s) => [s.subscriptionId, s.userId])
    );
    let calls = 0;
    const fetchStartDate = async (subscriptionId: string) => {
      calls += 1;
      return starts.get(subscriptionUser.get(subscriptionId)!)!;
    };

    const first = await backfillPremiumRoadmaps(fetchStartDate);
    assert.deepEqual(first, { startedAtSet: 2, roadmapsCreated: 1 });

    const roadmaps = await db.select().from(premiumRoadmaps);
    assert.lengthOf(roadmaps, 1);
    assert.equal(roadmaps[0].userId, recent.id);
    assert.equal(
      roadmaps[0].premiumStartedAt.getTime(),
      starts.get(recent.id)!.getTime()
    );

    const second = await backfillPremiumRoadmaps(fetchStartDate);
    assert.deepEqual(second, { startedAtSet: 0, roadmapsCreated: 0 });
    assert.equal(calls, 2);

    const [oldSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, old.id));
    assert.equal(oldSub.startedAt?.getTime(), starts.get(old.id)!.getTime());
  });
});
