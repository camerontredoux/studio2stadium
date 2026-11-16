import { db } from "#database/connection";
import { premiumGrants } from "#database/schema/organizations";
import { weekPasses } from "#database/schema/subscriptions";
import { users } from "#database/schema/users";
import {
  emailSuppressions,
  weekPassEmails,
} from "#database/schema/week-pass-emails";
import type { WeekPassEmailConfig } from "#shared/week-pass-emails/config";
import { verifyUnsubscribeToken } from "#shared/prospect-emails/unsubscribe-token";
import { createDancer, DAY_MS, subscribe } from "#tests/helpers/premium";
import type { BaseMail } from "@adonisjs/mail";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
import SendWeekPassEmailsService, {
  MAX_ATTEMPTS,
  type MailSender,
} from "./send-week-pass-emails.ts";

const ACTIVE_FROM = new Date("2026-01-01T00:00:00Z");

function config(
  overrides: Partial<{
    welcome: boolean;
    expired: boolean;
    problems: string[];
    activeFrom: Date | null;
    timezone: string;
  }> = {}
): () => WeekPassEmailConfig {
  const problems = overrides.problems ?? [];
  const kind = (enabled: boolean) => ({
    enabled,
    active: enabled && problems.length === 0,
    problems,
  });
  return () => ({
    welcome: kind(overrides.welcome ?? true),
    expired: kind(overrides.expired ?? true),
    activeFrom:
      overrides.activeFrom === undefined ? ACTIVE_FROM : overrides.activeFrom,
    timezone: overrides.timezone ?? "America/Denver",
    postalAddress: "TEST ADDRESS, NOT REAL",
    assetBaseUrl: "https://assets.example.invalid/week-pass",
  });
}

interface Sent {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
}

/** Records messages instead of sending them. Nothing reaches a transport. */
function recorder() {
  const sent: Sent[] = [];
  const send: MailSender = async (message: BaseMail) => {
    await message.build();
    const json = message.message.toJSON().message as any;
    const headers: Record<string, string> = {};
    const raw = json.headers ?? {};
    const entries = Array.isArray(raw)
      ? raw.map((h: { key: string; value: string }) => [h.key, h.value])
      : Object.entries(raw);
    for (const [k, v] of entries) headers[k] = String(v);
    sent.push({
      to: Array.isArray(json.to)
        ? json.to.map((t: any) => t.address ?? t).join(",")
        : json.to,
      subject: json.subject,
      html: json.html,
      text: json.text,
      headers,
    });
    return { messageId: `fake-${sent.length}` };
  };
  return { sent, send };
}

function service(now: Date, send: MailSender, cfg = config()) {
  return new SendWeekPassEmailsService({ now: () => now, send, config: cfg });
}

async function addPass(
  userId: string,
  startsAt: Date,
  endsAt: Date,
  opts: { createdAt?: Date; revokedAt?: Date | null; session?: string } = {}
) {
  const [pass] = await db
    .insert(weekPasses)
    .values({
      userId,
      checkoutSessionId: opts.session ?? `cs_${crypto.randomUUID()}`,
      paymentIntentId: `pi_${crypto.randomUUID()}`,
      startsAt,
      endsAt,
      revokedAt: opts.revokedAt ?? null,
      createdAt: opts.createdAt ?? startsAt,
    })
    .returning();
  return pass!;
}

async function oweWelcome(userId: string, weekPassId: string, key: string) {
  const [row] = await db
    .insert(weekPassEmails)
    // Due from the start of the test clock, not the real one.
    .values({
      kind: "welcome",
      dedupeKey: key,
      userId,
      weekPassId,
      nextAttemptAt: ACTIVE_FROM,
    })
    .returning();
  return row!;
}

const rows = () => db.select().from(weekPassEmails);
async function firstRow() {
  const [row] = await rows();
  return row!;
}
const at = (iso: string) => new Date(iso);
const days = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);

test.group("Week Pass emails: switches and dry run", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    await db.execute(sql`truncate table ${emailSuppressions}`);
  });

  test("both switches off: nothing is enqueued or sent", async ({ assert }) => {
    const dancer = await createDancer();
    const start = at("2026-03-01T12:00:00Z");
    const pass = await addPass(dancer.id, start, days(start, 7));
    await oweWelcome(dancer.id, pass.id, "cs_off");
    const { sent, send } = recorder();

    const report = await service(
      days(start, 8),
      send,
      config({ welcome: false, expired: false })
    ).run();

    assert.isTrue(report.skipped);
    assert.lengthOf(sent, 0);
    const [row] = await rows();
    assert.equal(row!.status, "pending");
    assert.equal(row!.attempts, 0);
    assert.lengthOf(await rows(), 1);
  });

  test("a switch on with missing settings fails closed", async ({ assert }) => {
    const dancer = await createDancer();
    const start = at("2026-03-01T12:00:00Z");
    await addPass(dancer.id, start, days(start, 7));
    const { sent, send } = recorder();

    const report = await service(
      days(start, 8),
      send,
      config({ problems: ["MAIL_POSTAL_ADDRESS is missing"] })
    ).run();

    assert.isTrue(report.skipped);
    assert.lengthOf(sent, 0);
    assert.lengthOf(await rows(), 0);
  });

  test("dry run reports without writing, claiming or sending", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const ended = await createDancer();
    const start = at("2026-03-01T12:00:00Z");
    const pass = await addPass(dancer.id, days(start, 6), days(start, 13));
    await oweWelcome(dancer.id, pass.id, "cs_dry");
    await addPass(ended.id, start, days(start, 7));
    const { sent, send } = recorder();

    // Switches off: a dry run still evaluates everything.
    const report = await service(
      days(start, 7),
      send,
      config({ welcome: false, expired: false })
    ).run({ dryRun: true });

    assert.equal(report.enqueued, 1);
    assert.equal(report.sent, 2);
    assert.deepEqual(report.plan.map((p) => `${p.kind}:${p.action}`).sort(), [
      "expired:enqueue",
      "expired:send",
      "welcome:send",
    ]);
    assert.lengthOf(sent, 0);
    const after = await rows();
    assert.lengthOf(after, 1);
    assert.equal(after[0]!.status, "pending");
    assert.equal(after[0]!.attempts, 0);

    // Eligibility was not used up: a live run afterwards still sends both.
    const live = await service(days(start, 7), send).run();
    assert.equal(live.sent, 2);
  });
});

test.group("Week Pass emails: welcome delivery", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    await db.execute(sql`truncate table ${emailSuppressions}`);
  });

  test("a first pass gets the approved design with its end date and zone", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const start = at("2026-11-16T17:15:00Z");
    const pass = await addPass(dancer.id, start, days(start, 7));
    await oweWelcome(dancer.id, pass.id, "cs_first");
    const { sent, send } = recorder();

    const report = await service(days(start, 0.001), send).run();

    assert.equal(report.sent, 1);
    assert.lengthOf(sent, 1);
    const mail = sent[0]!;
    assert.equal(mail.to, dancer.displayEmail);
    assert.equal(mail.subject, "Your S2S Week Pass starts now");
    assert.include(mail.html, "starts now.");
    assert.include(mail.text, "Monday, November 23, 2026 at 10:15 AM MST");
    assert.include(mail.text, `Hi ${dancer.firstName},`);
    assert.include(mail.html, "TEST ADDRESS, NOT REAL");
    assert.include(mail.html, "/settings/account");

    const unsubscribe = mail.headers["List-Unsubscribe"]!;
    assert.match(unsubscribe, /^<http:\/\/localhost:3333\/unsubscribe\?token=/);
    assert.equal(
      mail.headers["List-Unsubscribe-Post"],
      "List-Unsubscribe=One-Click"
    );
    const token = decodeURIComponent(
      unsubscribe.split("token=")[1]!.slice(0, -1)
    );
    assert.equal(verifyUnsubscribeToken(token), dancer.id);

    const [row] = await rows();
    assert.equal(row!.status, "sent");
    assert.equal(row!.providerMessageId, "fake-1");
    assert.isNull(row!.claimToken);
  });

  test("a queued pass gets its real start and the continuous end, never 'starts now'", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const bought = at("2026-11-18T17:15:00Z");
    await addPass(
      dancer.id,
      at("2026-11-16T17:15:00Z"),
      at("2026-11-23T17:15:00Z")
    );
    const queued = await addPass(
      dancer.id,
      at("2026-11-23T17:15:00Z"),
      at("2026-11-30T17:15:00Z"),
      { createdAt: bought }
    );
    // A third pass bought later stacks behind it too.
    await addPass(
      dancer.id,
      at("2026-11-30T17:15:00Z"),
      at("2026-12-07T17:15:00Z"),
      {
        createdAt: days(bought, 0.01),
      }
    );
    await oweWelcome(dancer.id, queued.id, "cs_queued");
    const { sent, send } = recorder();

    await service(days(bought, 0.02), send).run();

    const mail = sent[0]!;
    assert.equal(mail.subject, "Your next S2S Week Pass is lined up");
    assert.notInclude(mail.html, "starts now");
    assert.include(
      mail.text,
      "Your pass starts: Monday, November 23, 2026 at 10:15 AM MST"
    );
    assert.include(
      mail.text,
      "Your access ends: Monday, December 7, 2026 at 10:15 AM MST"
    );
  });

  test("a missing first name falls back to 'there'", async ({ assert }) => {
    const dancer = await createDancer();
    await db
      .update(users)
      .set({ firstName: "  " })
      .where(eq(users.id, dancer.id));
    const start = at("2026-11-16T17:15:00Z");
    const pass = await addPass(dancer.id, start, days(start, 7));
    await oweWelcome(dancer.id, pass.id, "cs_noname");
    const { sent, send } = recorder();

    await service(start, send).run();

    assert.include(sent[0]!.text, "Hi there,");
  });

  for (const [name, setup, reason] of [
    [
      "opted out of notifications",
      (id: string) =>
        db.update(users).set({ notifications: false }).where(eq(users.id, id)),
      "opted_out",
    ],
    [
      "a blank email",
      (id: string) =>
        db.update(users).set({ displayEmail: " " }).where(eq(users.id, id)),
      "no_email",
    ],
    [
      "an address on the suppression list",
      async (id: string) => {
        const [u] = await db.select().from(users).where(eq(users.id, id));
        await db.insert(emailSuppressions).values({
          email: u!.displayEmail.toUpperCase(),
          source: "sender",
          reason: "unsubscribed",
        });
      },
      "suppression_list",
    ],
  ] as const) {
    test(`suppressed for ${name}`, async ({ assert }) => {
      const dancer = await createDancer();
      await setup(dancer.id);
      const start = at("2026-11-16T17:15:00Z");
      const pass = await addPass(dancer.id, start, days(start, 7));
      await oweWelcome(dancer.id, pass.id, `cs_${reason}`);
      const { sent, send } = recorder();

      await service(start, send).run();

      assert.lengthOf(sent, 0);
      const [row] = await rows();
      assert.equal(row!.status, "suppressed");
      assert.equal(row!.suppressedReason, reason);
    });
  }

  test("a refunded or disputed pass gets no welcome", async ({ assert }) => {
    const dancer = await createDancer();
    const start = at("2026-11-16T17:15:00Z");
    const pass = await addPass(dancer.id, start, start, { revokedAt: start });
    await oweWelcome(dancer.id, pass.id, "cs_refund");
    const { sent, send } = recorder();

    await service(start, send).run();

    assert.lengthOf(sent, 0);
    const all = await rows();
    const welcome = all.find((r) => r.kind === "welcome");
    assert.equal(welcome!.suppressedReason, "refunded_or_disputed");
  });

  test("a welcome still owed after the access ended is dropped", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const start = at("2026-11-16T17:15:00Z");
    const pass = await addPass(dancer.id, start, days(start, 7));
    await oweWelcome(dancer.id, pass.id, "cs_late");
    const { sent, send } = recorder();

    await service(days(start, 7), send, config({ expired: false })).run();

    assert.lengthOf(sent, 0);
    const row1 = await firstRow();
    assert.equal(row1.suppressedReason, "pass_ended");
  });

  test("a deleted user takes their owed email with them", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const start = at("2026-11-16T17:15:00Z");
    const pass = await addPass(dancer.id, start, days(start, 7));
    await oweWelcome(dancer.id, pass.id, "cs_deleted");
    await db.delete(users).where(eq(users.id, dancer.id));
    const { sent, send } = recorder();

    await service(start, send).run();

    assert.lengthOf(sent, 0);
    assert.lengthOf(await rows(), 0);
  });

  test("a failed send is retried with backoff, then marked failed", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const start = at("2026-11-16T17:15:00Z");
    const pass = await addPass(dancer.id, start, days(start, 7));
    await oweWelcome(dancer.id, pass.id, "cs_retry");
    let calls = 0;
    const failing: MailSender = async () => {
      calls++;
      throw new Error("SES throttled");
    };

    let now = start;
    await service(now, failing).run();
    let [row] = await rows();
    assert.equal(row!.status, "pending");
    assert.equal(row!.attempts, 1);
    assert.equal(row!.lastError, "SES throttled");
    assert.equal(row!.nextAttemptAt.getTime(), now.getTime() + 2 * 60_000);

    // Not due yet: untouched.
    await service(new Date(now.getTime() + 60_000), failing).run();
    assert.equal(calls, 1);

    for (let attempt = 2; attempt <= MAX_ATTEMPTS; attempt++) {
      const row2 = await firstRow();
      now = row2.nextAttemptAt;
      await service(now, failing).run();
    }
    [row] = await rows();
    assert.equal(calls, MAX_ATTEMPTS);
    assert.equal(row!.status, "failed");
    assert.equal(row!.attempts, MAX_ATTEMPTS);

    await service(days(now, 1), failing).run();
    assert.equal(calls, MAX_ATTEMPTS);
  });

  test("a failed attempt that later succeeds is sent once", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const start = at("2026-11-16T17:15:00Z");
    const pass = await addPass(dancer.id, start, days(start, 7));
    await oweWelcome(dancer.id, pass.id, "cs_flaky");
    const { sent, send } = recorder();
    let failed = false;
    const flaky: MailSender = async (m) => {
      if (!failed) {
        failed = true;
        throw new Error("connection reset");
      }
      return send(m);
    };

    await service(start, flaky).run();
    const row3 = await firstRow();
    const due = row3.nextAttemptAt;
    await service(due, flaky).run();
    await service(days(due, 1), flaky).run();

    assert.lengthOf(sent, 1);
    const [row] = await rows();
    assert.equal(row!.status, "sent");
    assert.equal(row!.attempts, 2);
  });

  test("workers overlapping on the same rows send each one once", async ({
    assert,
  }) => {
    const start = at("2026-11-16T17:15:00Z");
    for (let i = 0; i < 6; i++) {
      const dancer = await createDancer();
      const pass = await addPass(dancer.id, start, days(start, 7));
      await oweWelcome(dancer.id, pass.id, `cs_overlap_${i}`);
    }
    const { sent, send } = recorder();
    const slow: MailSender = async (m) => {
      await new Promise((r) => setTimeout(r, 20));
      return send(m);
    };

    await Promise.all(
      Array.from({ length: 4 }, () => service(start, slow).run())
    );

    assert.lengthOf(sent, 6);
    assert.lengthOf(new Set(sent.map((s) => s.to)), 6);
    const final = await rows();
    assert.isTrue(final.every((r) => r.status === "sent"));
  });

  test("a lease left by a crashed worker is reclaimed only after it expires", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const start = at("2026-11-16T17:15:00Z");
    const pass = await addPass(dancer.id, start, days(start, 7));
    const row = await oweWelcome(dancer.id, pass.id, "cs_crash");
    await db
      .update(weekPassEmails)
      .set({
        status: "sending",
        attempts: 1,
        claimToken: crypto.randomUUID(),
        claimedUntil: new Date(start.getTime() + 5 * 60_000),
      })
      .where(eq(weekPassEmails.id, row.id));
    const { sent, send } = recorder();

    await service(new Date(start.getTime() + 60_000), send).run();
    assert.lengthOf(sent, 0);

    await service(new Date(start.getTime() + 6 * 60_000), send).run();
    assert.lengthOf(sent, 1);
    const row4 = await firstRow();
    assert.equal(row4.attempts, 2);
  });
});

test.group("Week Pass emails: expired-pass offer", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    await db.execute(sql`truncate table ${emailSuppressions}`);
  });

  const start = at("2026-11-16T17:15:00Z");
  const end = days(start, 7);

  test("sends exactly at the end of the run, not a millisecond before", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    await addPass(dancer.id, start, end);
    const { sent, send } = recorder();

    await service(new Date(end.getTime() - 1), send).run();
    assert.lengthOf(await rows(), 0);

    const report = await service(end, send).run();
    assert.equal(report.enqueued, 1);
    assert.lengthOf(sent, 1);
    assert.equal(sent[0]!.subject, "Your S2S Week Pass has ended");
    assert.include(sent[0]!.html, "Explore Premium Plans");
    assert.include(sent[0]!.html, "/settings/membership");
    assert.include(sent[0]!.html, "TEST ADDRESS, NOT REAL");
    assert.equal(
      sent[0]!.headers["List-Unsubscribe-Post"],
      "List-Unsubscribe=One-Click"
    );

    // Later ticks and overlapping machines owe nothing more.
    await Promise.all([
      service(days(end, 0.5), send).run(),
      service(days(end, 0.5), send).run(),
    ]);
    assert.lengthOf(sent, 1);
    assert.lengthOf(await rows(), 1);
  });

  test("stacked passes send once, after the last one, not at each pass's end", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    await addPass(dancer.id, start, end);
    await addPass(dancer.id, end, days(end, 7), { createdAt: days(start, 2) });
    const { sent, send } = recorder();

    await service(end, send).run();
    await service(days(end, 3), send).run();
    assert.lengthOf(sent, 0);

    await service(days(end, 7), send).run();
    assert.lengthOf(sent, 1);
    const row5 = await firstRow();
    assert.equal(row5.accessEndsAt!.getTime(), days(end, 7).getTime());
  });

  test("a pass bought after the run ended, before dispatch, suppresses it; its own end is a new run", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const first = await addPass(dancer.id, start, end);
    // Owed at the end, but not yet sent when the Dancer buys again.
    await db.insert(weekPassEmails).values({
      kind: "expired",
      dedupeKey: `${dancer.id}:${end.toISOString()}`,
      userId: dancer.id,
      weekPassId: first.id,
      accessEndsAt: end,
      nextAttemptAt: end,
    });
    const rebuy = days(end, 1);
    await addPass(dancer.id, rebuy, days(rebuy, 7));
    const { sent, send } = recorder();

    await service(days(rebuy, 0.01), send).run();
    assert.lengthOf(sent, 0);
    const row6 = await firstRow();
    assert.equal(row6.suppressedReason, "still_has_pass_access");

    await service(days(rebuy, 7), send).run();
    assert.lengthOf(sent, 1);
    assert.lengthOf(await rows(), 2);
  });

  for (const [name, setup, reason] of [
    [
      "an active subscription",
      (id: string) => subscribe(id, { startedAt: days(start, -60) }),
      "subscription_access",
    ],
    [
      "a trialing subscription",
      (id: string) =>
        subscribe(id, { status: "trialing", startedAt: days(start, 3) }),
      "subscription_access",
    ],
    [
      "a past_due subscription inside its grace",
      (id: string) =>
        subscribe(id, {
          status: "past_due",
          startedAt: days(start, -60),
          pastDueSince: days(end, -1),
        }),
      "subscription_access",
    ],
    [
      "an upgrade during the run that has since been canceled",
      (id: string) =>
        subscribe(id, { status: "canceled", startedAt: days(start, 2) }),
      "upgraded",
    ],
    [
      "an active premium grant",
      (id: string) =>
        db.insert(premiumGrants).values({
          userId: id,
          sourceType: "org_event",
          expiresAt: days(end, 30),
        }),
      "premium_grant",
    ],
    [
      "opting out of notifications",
      (id: string) =>
        db.update(users).set({ notifications: false }).where(eq(users.id, id)),
      "opted_out",
    ],
  ] as const) {
    test(`suppressed for ${name}`, async ({ assert }) => {
      const dancer = await createDancer();
      await addPass(dancer.id, start, end);
      await setup(dancer.id);
      const { sent, send } = recorder();

      // The past_due grace is five days from the failure.
      await service(days(end, 0.5), send).run();

      assert.lengthOf(sent, 0);
      const [row] = await rows();
      assert.equal(row!.status, "suppressed");
      assert.equal(row!.suppressedReason, reason);
    });
  }

  test("a refunded or disputed pass never turns into an offer", async ({
    assert,
  }) => {
    const running = await createDancer();
    const queued = await createDancer();
    // Refunded mid-run: its end was cut back to the refund.
    await addPass(running.id, start, days(start, 2), {
      revokedAt: days(start, 2),
    });
    // A queued pass refunded before it started; the first pass ran out.
    await addPass(queued.id, start, end);
    await addPass(queued.id, end, end, {
      revokedAt: days(start, 1),
      createdAt: days(start, 0.5),
    });
    const { sent, send } = recorder();

    await service(days(start, 2), send).run();
    await service(end, send).run();

    assert.lengthOf(sent, 0);
    for (const row of await rows()) {
      assert.equal(row.suppressedReason, "refunded_or_disputed");
    }
  });

  test("runs that ended before the activation cutoff are never replayed", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    await addPass(dancer.id, start, end);
    const { sent, send } = recorder();

    await service(
      days(end, 1),
      send,
      config({ activeFrom: days(end, 0.5) })
    ).run();

    assert.lengthOf(sent, 0);
    assert.lengthOf(await rows(), 0);
  });

  test("a run more than three days gone is not picked up late", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    await addPass(dancer.id, start, end);
    const { sent, send } = recorder();

    await service(days(end, 3.01), send).run();

    assert.lengthOf(sent, 0);
    assert.lengthOf(await rows(), 0);
  });

  test("the welcome switch alone never sends the offer", async ({ assert }) => {
    const dancer = await createDancer();
    await addPass(dancer.id, start, end);
    const { sent, send } = recorder();

    await service(end, send, config({ expired: false })).run();

    assert.lengthOf(sent, 0);
    assert.lengthOf(await rows(), 0);
  });
});
