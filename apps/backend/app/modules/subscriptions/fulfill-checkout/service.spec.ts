import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import { buyWeekPass, createDancer, DAY_MS } from "#tests/helpers/premium";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";
import { FulfillCheckoutService, type CompletedSession } from "./service.ts";

function weekPassSession(
  userId: string,
  id: string,
  paymentStatus: CompletedSession["payment_status"] = "paid"
): CompletedSession {
  return {
    id,
    client_reference_id: userId,
    subscription: null,
    metadata: { purchase: "week_pass" },
    payment_status: paymentStatus,
    payment_intent: `pi_${id}`,
  };
}

const daysLeft = async (userId: string) => {
  const status = await new GetSubscriptionService(
    new DatabaseService()
  ).execute(userId);
  return status.currentPeriodEnd
    ? (status.currentPeriodEnd.getTime() - Date.now()) / DAY_MS
    : null;
};

test.group("Week Pass fulfilment", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  const fulfill = new FulfillCheckoutService(new DatabaseService());

  test("a pass bought while one is running adds seven days to it", async ({
    assert,
  }) => {
    const dancer = await createDancer();

    await fulfill.execute(weekPassSession(dancer.id, "cs_first"));
    await fulfill.execute(weekPassSession(dancer.id, "cs_second"));

    assert.closeTo((await daysLeft(dancer.id))!, 14, 0.01);
  });

  test("an expired pass gives no access, and the next one starts from purchase", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    await buyWeekPass(dancer.id, new Date(Date.now() - DAY_MS));

    assert.isNull(await daysLeft(dancer.id));

    await fulfill.execute(weekPassSession(dancer.id, "cs_after_lapse"));

    assert.closeTo((await daysLeft(dancer.id))!, 7, 0.01);
  });

  test("an unpaid session gives no pass", async ({ assert }) => {
    const dancer = await createDancer();

    await fulfill.execute(weekPassSession(dancer.id, "cs_unpaid", "unpaid"));

    assert.isNull(await daysLeft(dancer.id));
  });
});
