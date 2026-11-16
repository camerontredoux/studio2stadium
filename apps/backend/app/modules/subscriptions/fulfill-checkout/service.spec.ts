import { db } from "#database/connection";
import { weekPasses } from "#database/schema/subscriptions";
import { weekPassEmails } from "#database/schema/week-pass-emails";
import type { RecordWeekPassWelcome } from "#shared/week-pass-emails/record-welcome";
import env from "#start/env";
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

test.group("Week Pass fulfilment: welcome email obligation", (group) => {
  const SETTINGS = [
    "WEEK_PASS_WELCOME_EMAIL_ENABLED",
    "WEEK_PASS_EXPIRED_EMAIL_ENABLED",
    "WEEK_PASS_EMAILS_ACTIVE_FROM",
    "MAIL_POSTAL_ADDRESS",
    "EMAIL_SUPPRESSION_IMPORTED_AT",
  ] as const;
  let saved: Record<string, unknown> = {};

  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    saved = Object.fromEntries(SETTINGS.map((k) => [k, env.get(k)]));
    env.set("WEEK_PASS_WELCOME_EMAIL_ENABLED", true);
    env.set("WEEK_PASS_EMAILS_ACTIVE_FROM", "2026-01-01T00:00:00Z");
    env.set("MAIL_POSTAL_ADDRESS", "TEST ADDRESS, NOT REAL");
    env.set("EMAIL_SUPPRESSION_IMPORTED_AT", "2026-01-01T00:00:00Z");
    return () => {
      for (const key of SETTINGS) env.set(key, saved[key] as never);
    };
  });

  const fulfill = new FulfillCheckoutService(new DatabaseService());
  const owed = () => db.select().from(weekPassEmails);
  const passes = () => db.select().from(weekPasses);

  test("a first paid pass owes one welcome, keyed by its session", async ({
    assert,
  }) => {
    const dancer = await createDancer();

    await fulfill.execute(weekPassSession(dancer.id, "cs_welcome_first"));

    const [pass] = await passes();
    const rows = await owed();
    assert.lengthOf(rows, 1);
    assert.equal(rows[0]!.kind, "welcome");
    assert.equal(rows[0]!.dedupeKey, "cs_welcome_first");
    assert.equal(rows[0]!.weekPassId, pass!.id);
    assert.equal(rows[0]!.status, "pending");
  });

  test("a repeat pass owes its own welcome and starts when the first ends", async ({
    assert,
  }) => {
    const dancer = await createDancer();

    await fulfill.execute(weekPassSession(dancer.id, "cs_one"));
    await fulfill.execute(weekPassSession(dancer.id, "cs_two"));

    const rows = await owed();
    assert.lengthOf(rows, 2);
    const all = await passes();
    const second = all.find((p) => p.checkoutSessionId === "cs_two")!;
    const first = all.find((p) => p.checkoutSessionId === "cs_one")!;
    assert.equal(second.startsAt.getTime(), first.endsAt.getTime());
  });

  test("an unpaid session owes nothing", async ({ assert }) => {
    const dancer = await createDancer();

    await fulfill.execute(
      weekPassSession(dancer.id, "cs_welcome_unpaid", "unpaid")
    );

    assert.lengthOf(await passes(), 0);
    assert.lengthOf(await owed(), 0);
  });

  test("the webhook and the checkout return, in turn or at once, owe one welcome", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const other = await createDancer();

    await fulfill.execute(weekPassSession(dancer.id, "cs_twice"));
    await fulfill.execute(weekPassSession(dancer.id, "cs_twice"));
    await Promise.all(
      Array.from({ length: 5 }, () =>
        fulfill.execute(weekPassSession(other.id, "cs_race"))
      )
    );

    assert.lengthOf(await passes(), 2);
    const rows = await owed();
    assert.deepEqual(rows.map((r) => r.dedupeKey).sort(), [
      "cs_race",
      "cs_twice",
    ]);
  });

  test("if recording the welcome fails, the pass rolls back with it and a retry records both once", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const failing = new FulfillCheckoutService(new DatabaseService(), {
      async execute() {
        throw new Error("boom");
      },
    } as unknown as RecordWeekPassWelcome);

    await assert.rejects(() =>
      failing.execute(weekPassSession(dancer.id, "cs_rollback"))
    );
    assert.lengthOf(await passes(), 0);
    assert.lengthOf(await owed(), 0);

    await fulfill.execute(weekPassSession(dancer.id, "cs_rollback"));
    assert.lengthOf(await passes(), 1);
    assert.lengthOf(await owed(), 1);
  });

  test("with the switch off the pass is recorded and nothing is owed", async ({
    assert,
  }) => {
    env.set("WEEK_PASS_WELCOME_EMAIL_ENABLED", false);
    const dancer = await createDancer();

    await fulfill.execute(weekPassSession(dancer.id, "cs_off"));

    assert.lengthOf(await passes(), 1);
    assert.lengthOf(await owed(), 0);
  });

  test("the expired-pass switch alone does not owe a welcome", async ({
    assert,
  }) => {
    env.set("WEEK_PASS_WELCOME_EMAIL_ENABLED", false);
    env.set("WEEK_PASS_EXPIRED_EMAIL_ENABLED", true);
    const dancer = await createDancer();

    await fulfill.execute(weekPassSession(dancer.id, "cs_expired_only"));

    assert.lengthOf(await owed(), 0);
  });

  test("purchases before the activation cutoff owe nothing", async ({
    assert,
  }) => {
    env.set("WEEK_PASS_EMAILS_ACTIVE_FROM", "2099-01-01T00:00:00Z");
    const dancer = await createDancer();

    await fulfill.execute(weekPassSession(dancer.id, "cs_early"));

    assert.lengthOf(await passes(), 1);
    assert.lengthOf(await owed(), 0);
  });

  test("the welcome fails closed until suppression history is imported", async ({
    assert,
  }) => {
    env.set("EMAIL_SUPPRESSION_IMPORTED_AT", "");
    const dancer = await createDancer();

    await fulfill.execute(weekPassSession(dancer.id, "cs_no_suppression"));

    assert.lengthOf(await passes(), 1);
    assert.lengthOf(await owed(), 0);
  });

  test("a switch on with a missing postal address fails closed", async ({
    assert,
  }) => {
    env.set("MAIL_POSTAL_ADDRESS", "");
    const dancer = await createDancer();

    await fulfill.execute(weekPassSession(dancer.id, "cs_no_address"));

    assert.lengthOf(await passes(), 1);
    assert.lengthOf(await owed(), 0);
  });
});
