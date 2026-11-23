import { db } from "#database/connection";
import { dancerProfiles } from "#database/schema/dancers";
import { premiumGrants } from "#database/schema/organizations";
import { subscriptions, weekPasses } from "#database/schema/subscriptions";
import { users } from "#database/schema/users";
import { emailSuppressions } from "#database/schema/week-pass-emails";
import { DatabaseService } from "#database/service";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import { PAST_DUE_GRACE_DAYS, priceIdFor } from "#shared/plans";
import { records } from "#tests/helpers/csv";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
import {
  COLUMNS,
  DancerAccessExportService,
  MARKETING_OPT_IN_NOT_RECORDED,
} from "./service.ts";

// Dummy fixtures only: example.test addresses and invented names.
const DAY = 86_400_000;
const NOW = new Date("2026-11-27T12:00:00.000Z");
const at = (days: number) => new Date(NOW.getTime() + days * DAY);

let seq = 0;

async function dancer(
  name: string,
  opts: {
    displayEmail?: string;
    profile?: boolean;
    notifications?: boolean;
    type?: "dancer" | "school";
    firstName?: string;
  } = {}
) {
  const email = `${name}@example.test`;
  const [user] = await db
    .insert(users)
    .values({
      username: name,
      email,
      displayEmail: opts.displayEmail ?? email,
      firstName: opts.firstName ?? "Fixture",
      lastName: name,
      password: "x",
      role: "user",
      type: opts.type ?? "dancer",
      verified: true,
      notifications: opts.notifications ?? true,
      createdAt: new Date(NOW.getTime() - 100 * DAY + seq++ * 1000),
    })
    .returning();
  if (opts.profile !== false && (opts.type ?? "dancer") === "dancer") {
    await db
      .insert(dancerProfiles)
      .values({ userId: user!.id, birthday: "2009-01-01", location: "CA" });
  }
  return user!;
}

async function stripe(
  userId: string,
  values: {
    status: string;
    currentPeriodEnd: Date;
    pastDueSince?: Date | null;
    cancelAtPeriodEnd?: boolean;
    priceId?: string | null;
  }
) {
  await db.insert(subscriptions).values({
    userId,
    source: "stripe",
    subscriptionId: `sub_fixture_${seq++}`,
    customerId: `cus_fixture_${seq++}`,
    priceId:
      values.priceId === undefined ? priceIdFor("monthly") : values.priceId,
    status: values.status,
    currentPeriodEnd: values.currentPeriodEnd,
    pastDueSince: values.pastDueSince ?? null,
    cancelAtPeriodEnd: values.cancelAtPeriodEnd ?? false,
  });
}

async function grant(
  userId: string,
  expiresAt: Date,
  revokedAt: Date | null = null
) {
  await db.insert(premiumGrants).values({
    userId,
    sourceType: "org_event",
    grantedAt: at(-10),
    expiresAt,
    revokedAt,
  });
}

async function pass(userId: string, startsAt: Date, endsAt: Date) {
  await db.insert(weekPasses).values({
    userId,
    checkoutSessionId: `cs_fixture_${seq++}`,
    startsAt,
    endsAt,
  });
}

function service(access = new GetSubscriptionService(new DatabaseService())) {
  return new DancerAccessExportService(new DatabaseService(), access);
}

async function exportByUsername(svc = service()) {
  const result = await svc.execute(NOW);
  const rows = records(result.csv);
  return {
    result,
    rows,
    by: Object.fromEntries(rows.map((r) => [r.username, r])),
  };
}

test.group("Dancer access export", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    await db.delete(emailSuppressions).execute();
  });

  test("header lists the documented columns in order", async ({ assert }) => {
    await dancer("only-one");
    const { result } = await exportByUsername();
    assert.equal(result.csv.split("\r\n")[0], COLUMNS.join(","));
  });

  test("covers every Dancer account, and only Dancers, with a reliable row count", async ({
    assert,
  }) => {
    await dancer("with-profile");
    await dancer("no-profile", { profile: false });
    await db
      .update(users)
      .set({ verified: false })
      .where(eq(users.username, "no-profile"));
    await dancer("a-coach", { type: "school" });

    const { result, rows, by } = await exportByUsername();
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.type, "dancer"));

    assert.equal(result.rowCount, count);
    assert.equal(rows.length, 2);
    assert.notProperty(by, "a-coach");
    assert.equal(by["no-profile"]!.has_dancer_profile, "false");
    assert.equal(by["no-profile"]!.onboarding_complete, "false");
    assert.equal(result.failedLookups, 0);
    assert.isTrue(rows.every((r) => r.snapshot_at === NOW.toISOString()));
  });

  test("free Dancer with nothing on record has no access and no sources", async ({
    assert,
  }) => {
    await dancer("free");
    const { by } = await exportByUsername();
    const r = by.free!;
    assert.equal(r.account_role, "user");
    assert.equal(r.access_lookup, "ok");
    assert.equal(r.has_current_access, "false");
    assert.equal(r.access_level, "free");
    assert.equal(r.current_plan, "free");
    assert.equal(r.primary_access_source, "none");
    assert.equal(r.active_access_sources, "none");
    assert.equal(r.access_ends_at, "");
    assert.equal(r.stripe_customer_id, "");
    assert.equal(r.billing_email_status, "no_stripe_customer");
  });

  test("Stripe: active, past_due in grace, past_due after grace, and canceled", async ({
    assert,
  }) => {
    const active = await dancer("stripe-active");
    await stripe(active.id, {
      status: "active",
      currentPeriodEnd: at(20),
      cancelAtPeriodEnd: true,
    });

    const grace = await dancer("stripe-grace");
    const failedAt = at(-2);
    await stripe(grace.id, {
      status: "past_due",
      currentPeriodEnd: at(28),
      pastDueSince: failedAt,
    });

    const lapsed = await dancer("stripe-grace-over");
    await stripe(lapsed.id, {
      status: "past_due",
      currentPeriodEnd: at(20),
      pastDueSince: at(-(PAST_DUE_GRACE_DAYS + 1)),
    });

    const canceled = await dancer("stripe-canceled");
    await stripe(canceled.id, { status: "canceled", currentPeriodEnd: at(-3) });

    const { by } = await exportByUsername();

    assert.include(by["stripe-active"], {
      has_current_access: "true",
      access_level: "premium",
      current_plan: "monthly",
      primary_access_source: "stripe",
      active_access_sources: "stripe",
      access_ends_at: at(20).toISOString(),
      stripe_subscription_status: "active",
      stripe_in_payment_grace: "false",
      stripe_cancel_at_period_end: "true",
      billing_email: "",
      billing_email_status: "not_stored_in_app_see_stripe_customer",
    });
    assert.match(by["stripe-active"]!.stripe_customer_id!, /^cus_fixture_/);

    assert.include(by["stripe-grace"], {
      has_current_access: "true",
      primary_access_source: "stripe",
      stripe_subscription_status: "past_due",
      stripe_in_payment_grace: "true",
      access_ends_at: new Date(
        failedAt.getTime() + PAST_DUE_GRACE_DAYS * DAY
      ).toISOString(),
    });

    assert.include(by["stripe-grace-over"], {
      has_current_access: "false",
      current_plan: "free",
      active_access_sources: "none",
      stripe_subscription_status: "past_due",
      stripe_in_payment_grace: "false",
    });

    assert.include(by["stripe-canceled"], {
      has_current_access: "false",
      current_plan: "free",
      stripe_subscription_status: "canceled",
      stripe_stored_period_end: at(-3).toISOString(),
    });
  });

  test("premium grants: unrevoked counts, revoked and expired do not", async ({
    assert,
  }) => {
    const live = await dancer("grant-live");
    await grant(live.id, at(30));
    const revoked = await dancer("grant-revoked");
    await grant(revoked.id, at(30), at(-1));
    const expired = await dancer("grant-expired");
    await grant(expired.id, at(-1));

    const { by } = await exportByUsername();

    assert.include(by["grant-live"], {
      has_current_access: "true",
      access_level: "premium",
      current_plan: "premium",
      primary_access_source: "org_event",
      active_access_sources: "org_event",
      access_ends_at: at(30).toISOString(),
      latest_unrevoked_grant_expires_at: at(30).toISOString(),
    });
    assert.include(by["grant-revoked"], {
      has_current_access: "false",
      active_access_sources: "none",
      latest_unrevoked_grant_expires_at: "",
    });
    assert.include(by["grant-expired"], {
      has_current_access: "false",
      active_access_sources: "none",
      latest_unrevoked_grant_expires_at: at(-1).toISOString(),
    });
  });

  test("Week Passes: running and back-to-back count, ended and not-yet-started do not", async ({
    assert,
  }) => {
    const running = await dancer("pass-running");
    await pass(running.id, at(-2), at(5));
    await pass(running.id, at(5), at(12));

    const ended = await dancer("pass-ended");
    await pass(ended.id, at(-9), at(-2));

    const { by } = await exportByUsername();

    assert.include(by["pass-running"], {
      has_current_access: "true",
      access_level: "pass",
      current_plan: "week_pass",
      primary_access_source: "week_pass",
      active_access_sources: "week_pass",
      access_ends_at: at(12).toISOString(),
    });
    assert.include(by["pass-ended"], {
      has_current_access: "false",
      current_plan: "free",
      active_access_sources: "none",
      latest_week_pass_ends_at: at(-2).toISOString(),
    });
  });

  test("overlapping sources are all listed; the primary follows the live app's ranking", async ({
    assert,
  }) => {
    const all = await dancer("overlap-all");
    await stripe(all.id, { status: "active", currentPeriodEnd: at(20) });
    await grant(all.id, at(40));
    await pass(all.id, at(-1), at(6));

    const grantAndPass = await dancer("overlap-grant-pass");
    await grant(grantAndPass.id, at(40));
    await pass(grantAndPass.id, at(-1), at(6));

    const lapsedStripePlusPass = await dancer("overlap-lapsed-stripe-pass");
    await stripe(lapsedStripePlusPass.id, {
      status: "canceled",
      currentPeriodEnd: at(-1),
    });
    await pass(lapsedStripePlusPass.id, at(-1), at(6));

    const { by } = await exportByUsername();

    assert.include(by["overlap-all"], {
      primary_access_source: "stripe",
      active_access_sources: "stripe;org_event;week_pass",
      current_plan: "monthly",
      access_ends_at: at(20).toISOString(),
    });
    assert.include(by["overlap-grant-pass"], {
      primary_access_source: "org_event",
      active_access_sources: "org_event;week_pass",
      access_level: "premium",
    });
    assert.include(by["overlap-lapsed-stripe-pass"], {
      primary_access_source: "week_pass",
      active_access_sources: "week_pass",
      stripe_subscription_status: "canceled",
    });
  });

  test("access columns match what the live app's GetSubscriptionService returns", async ({
    assert,
  }) => {
    const a = await dancer("parity-a");
    await stripe(a.id, {
      status: "trialing",
      currentPeriodEnd: at(3),
      priceId: "price_not_a_plan",
    });
    const b = await dancer("parity-b");
    await grant(b.id, at(2));
    await dancer("parity-c");

    const live = new GetSubscriptionService(new DatabaseService());
    const { rows } = await exportByUsername();

    for (const row of rows) {
      const status = await live.execute(row.user_id!, NOW);
      assert.equal(row.has_current_access, String(status.subscribed));
      assert.equal(row.access_level, status.access);
      assert.equal(row.current_plan, status.plan);
      assert.equal(row.primary_access_source, status.source);
      assert.equal(
        row.access_ends_at,
        status.currentPeriodEnd?.toISOString() ?? ""
      );
    }
    assert.equal(
      rows.find((r) => r.username === "parity-a")!.current_plan,
      "premium"
    );
  });

  test("a failed access lookup is reported as unknown, never as free", async ({
    assert,
  }) => {
    const broken = await dancer("lookup-broken");
    await dancer("lookup-fine");

    const real = new GetSubscriptionService(new DatabaseService());
    let calls = 0;
    const flaky = Object.assign(Object.create(real), {
      resolve: async (userId: string, now: Date) => {
        if (userId === broken.id) {
          calls++;
          throw new Error("simulated lookup failure");
        }
        return real.resolve(userId, now);
      },
    }) as GetSubscriptionService;

    const { result, by } = await exportByUsername(service(flaky));

    assert.equal(calls, 2, "retried once before giving up");
    assert.equal(result.failedLookups, 1);
    assert.equal(result.rowCount, 2);
    assert.include(by["lookup-broken"], {
      access_lookup: "failed",
      has_current_access: "unknown",
      access_level: "unknown",
      current_plan: "unknown",
      primary_access_source: "unknown",
      active_access_sources: "unknown",
      stripe_subscription_status: "unknown",
      stripe_in_payment_grace: "unknown",
    });
    assert.include(by["lookup-fine"], {
      access_lookup: "ok",
      current_plan: "free",
    });
  });

  test("keeps different login and display emails apart", async ({ assert }) => {
    await dancer("same-email");
    await dancer("other-email", { displayEmail: "Other.Inbox@example.test" });
    await dancer("case-only", { displayEmail: "CASE-ONLY@example.test" });

    const { by } = await exportByUsername();

    assert.include(by["same-email"], {
      login_email: "same-email@example.test",
      profile_display_email: "same-email@example.test",
      display_email_differs_from_login: "false",
    });
    assert.include(by["other-email"], {
      login_email: "other-email@example.test",
      profile_display_email: "Other.Inbox@example.test",
      display_email_differs_from_login: "true",
    });
    assert.include(by["case-only"], {
      profile_display_email: "CASE-ONLY@example.test",
      display_email_differs_from_login: "false",
    });
  });

  test("never records marketing consent; shows the opt-out setting and suppressions as recorded", async ({
    assert,
  }) => {
    await dancer("notif-on");
    await dancer("notif-off", { notifications: false });
    await dancer("suppressed", {
      displayEmail: "suppressed.inbox@example.test",
    });
    await db.insert(emailSuppressions).values([
      {
        email: "suppressed.inbox@example.test",
        source: "sender",
        reason: "unsubscribed",
      },
      { email: "suppressed@example.test", source: "ses", reason: "bounced" },
    ]);

    const { rows, by } = await exportByUsername();

    assert.isTrue(
      rows.every((r) => r.marketing_opt_in === MARKETING_OPT_IN_NOT_RECORDED)
    );
    assert.equal(by["notif-on"]!.in_app_notifications_setting, "on");
    assert.equal(by["notif-off"]!.in_app_notifications_setting, "off");
    assert.equal(by["notif-on"]!.email_suppressions, "");
    assert.equal(
      by.suppressed!.email_suppressions,
      "sender:unsubscribed:display_email;ses:bounced:login_email"
    );
  });

  test("escapes hostile names so the file opens safely", async ({ assert }) => {
    await dancer("hostile", {
      firstName: '=HYPERLINK("http://x.test","click"), "and"\nmore',
    });

    const { result, by } = await exportByUsername();

    assert.equal(
      by.hostile!.first_name,
      `'=HYPERLINK("http://x.test","click"), "and"\nmore`
    );
    assert.equal(result.rowCount, 1);
  });
});
