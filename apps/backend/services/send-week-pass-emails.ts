import { db } from "#database/connection";
import { weekPasses } from "#database/schema/subscriptions";
import {
  weekPassEmails,
  type WeekPassEmailKind,
} from "#database/schema/week-pass-emails";
import {
  activeKinds,
  weekPassEmailConfig,
  type WeekPassEmailConfig,
} from "#shared/week-pass-emails/config";
import {
  decideExpired,
  decideWelcome,
  EXPIRED_STALE_MS,
  type SuppressReason,
} from "#shared/week-pass-emails/eligibility";
import {
  WeekPassExpiredMail,
  WeekPassWelcomeMail,
} from "#shared/week-pass-emails/mails";
import type { BaseMail } from "@adonisjs/mail";
import mail from "@adonisjs/mail/services/main";
import { randomUUID } from "node:crypto";
import { and, asc, eq, gte, inArray, lt, lte, or, sql } from "drizzle-orm";

/** Sends one prepared message. Tests replace it; production uses SES. */
export type MailSender = (message: BaseMail) => Promise<{ messageId?: string }>;

export const MAX_ATTEMPTS = 5;
/** How long a worker owns a claimed row before another may take it. */
export const LEASE_MS = 5 * 60_000;
const BATCH_SIZE = 50;

/** Minutes before attempt n+1: 2, 4, 8, 16. */
export function retryDelayMs(attempts: number) {
  return 2 ** attempts * 60_000;
}

export interface ExpiredCandidate {
  userId: string;
  weekPassId: string;
  endsAt: Date;
}

export function expiredDedupeKey(userId: string, endsAt: Date) {
  return `${userId}:${endsAt.toISOString()}`;
}

export interface WeekPassEmailReport {
  dryRun: boolean;
  skipped: boolean;
  problems: Record<WeekPassEmailKind, string[]>;
  enqueued: number;
  sent: number;
  suppressed: Partial<Record<SuppressReason, number>>;
  retrying: number;
  failed: number;
  /** Dry run only: what a live run would do, row by row. */
  plan: {
    kind: WeekPassEmailKind;
    userId: string;
    action: "enqueue" | "send" | "suppress";
    reason?: SuppressReason;
  }[];
}

interface Options {
  now?: () => Date;
  send?: MailSender;
  /** Overrides the settings, for tests. */
  config?: () => WeekPassEmailConfig;
}

type Row = typeof weekPassEmails.$inferSelect;

/**
 * Delivers the Week Pass emails. Every minute on every machine:
 *
 * 1. If the expired-pass email is active, owe one for each Dancer whose
 *    latest pass ended (at or after the activation cutoff, within the last
 *    three days) with nothing after it. The unique key makes repeats and
 *    overlapping machines harmless.
 * 2. Claim due rows with one UPDATE ... FOR UPDATE SKIP LOCKED, which is a
 *    single statement and so safe under the transaction pooler. Each claim is
 *    a lease: a worker that dies leaves the row to be reclaimed later.
 * 3. Recheck each claimed row against current data, then send it, suppress
 *    it with a reason, or schedule a retry.
 *
 * Does nothing at all, not even a query, while both emails are off.
 */
export default class SendWeekPassEmailsService {
  private now: () => Date;
  private send: MailSender;
  private config: () => WeekPassEmailConfig;

  constructor(options: Options = {}) {
    this.now = options.now ?? (() => new Date());
    this.send =
      options.send ??
      (async (message) => {
        const response = await mail.send(message);
        return { messageId: response?.messageId };
      });
    this.config = options.config ?? weekPassEmailConfig;
  }

  async run(opts: { dryRun?: boolean } = {}): Promise<WeekPassEmailReport> {
    const dryRun = opts.dryRun ?? false;
    const config = this.config();
    const report: WeekPassEmailReport = {
      dryRun,
      skipped: false,
      problems: {
        welcome: config.welcome.problems,
        expired: config.expired.problems,
      },
      enqueued: 0,
      sent: 0,
      suppressed: {},
      retrying: 0,
      failed: 0,
      plan: [],
    };

    if (dryRun) return await this.dryRun(config, report);

    const kinds = activeKinds(config);
    for (const kind of ["welcome", "expired"] as const) {
      if (config[kind].enabled && !config[kind].active) {
        console.error(
          `[WeekPassEmails]: ${kind} email is switched on but cannot activate: ${config[kind].problems.join("; ")}`
        );
      }
    }
    if (kinds.length === 0) {
      report.skipped = true;
      return report;
    }

    const now = this.now();
    if (kinds.includes("expired")) {
      report.enqueued = await this.enqueueExpired(config, now);
    }

    const rows = await this.claim(kinds, now);
    for (const row of rows) {
      await this.deliver(row, config, report);
    }
    return report;
  }

  /** Runs whose end makes them owed an expired-pass email now. */
  async expiredCandidates(
    config: WeekPassEmailConfig,
    now: Date
  ): Promise<ExpiredCandidate[]> {
    if (!config.activeFrom) return [];
    const floor = new Date(
      Math.max(config.activeFrom.getTime(), now.getTime() - EXPIRED_STALE_MS)
    );
    const later = db
      .select({ one: sql`1` })
      .from(sql`${weekPasses} as later`)
      .where(
        sql`later.user_id = ${weekPasses.userId} and later.ends_at > ${weekPasses.endsAt}`
      );

    const rows = await db
      .selectDistinctOn([weekPasses.userId], {
        userId: weekPasses.userId,
        weekPassId: weekPasses.id,
        endsAt: weekPasses.endsAt,
      })
      .from(weekPasses)
      .where(
        and(
          lte(weekPasses.endsAt, now),
          gte(weekPasses.endsAt, floor),
          sql`not exists (${later})`
        )
      )
      .orderBy(
        weekPasses.userId,
        sql`${weekPasses.revokedAt} is not null`,
        weekPasses.createdAt
      );
    return rows;
  }

  private async enqueueExpired(config: WeekPassEmailConfig, now: Date) {
    const candidates = await this.expiredCandidates(config, now);
    if (candidates.length === 0) return 0;

    const inserted = await db
      .insert(weekPassEmails)
      .values(
        candidates.map((c) => ({
          kind: "expired" as const,
          dedupeKey: expiredDedupeKey(c.userId, c.endsAt),
          userId: c.userId,
          weekPassId: c.weekPassId,
          accessEndsAt: c.endsAt,
          nextAttemptAt: now,
        }))
      )
      .onConflictDoNothing()
      .returning({ id: weekPassEmails.id });
    return inserted.length;
  }

  private async claim(kinds: WeekPassEmailKind[], now: Date): Promise<Row[]> {
    const token = randomUUID();
    const due = db
      .select({ id: weekPassEmails.id })
      .from(weekPassEmails)
      .where(
        and(
          inArray(weekPassEmails.kind, kinds),
          lte(weekPassEmails.nextAttemptAt, now),
          or(
            eq(weekPassEmails.status, "pending"),
            and(
              eq(weekPassEmails.status, "sending"),
              lt(weekPassEmails.claimedUntil, now)
            )
          )
        )
      )
      .orderBy(asc(weekPassEmails.nextAttemptAt))
      .limit(BATCH_SIZE)
      .for("update", { skipLocked: true });

    return await db
      .update(weekPassEmails)
      .set({
        status: "sending",
        claimToken: token,
        claimedUntil: new Date(now.getTime() + LEASE_MS),
        attempts: sql`${weekPassEmails.attempts} + 1`,
      })
      .where(inArray(weekPassEmails.id, due))
      .returning();
  }

  /** Finish a row this worker still holds; a lost lease changes nothing. */
  private async finish(row: Row, values: Partial<Row>) {
    await db
      .update(weekPassEmails)
      .set({ ...values, claimToken: null, claimedUntil: null })
      .where(
        and(
          eq(weekPassEmails.id, row.id),
          eq(weekPassEmails.claimToken, row.claimToken!)
        )
      );
  }

  private async prepare(row: Row, config: WeekPassEmailConfig, now: Date) {
    const footer = {
      postalAddress: config.postalAddress!,
      assetBaseUrl: config.assetBaseUrl,
    };
    if (row.kind === "welcome") {
      const decision = await decideWelcome(row, config, now);
      if (!decision.send) return decision;
      return {
        send: true as const,
        message: new WeekPassWelcomeMail({
          ...decision.recipient,
          ...footer,
          variant: decision.variant,
          startsAt: decision.startsAt,
          accessEndsAt: decision.accessEndsAt,
          timezone: config.timezone,
        }),
      };
    }
    const decision = await decideExpired(row, config, now);
    if (!decision.send) return decision;
    return {
      send: true as const,
      message: new WeekPassExpiredMail({ ...decision.recipient, ...footer }),
    };
  }

  private async deliver(
    row: Row,
    config: WeekPassEmailConfig,
    report: WeekPassEmailReport
  ) {
    try {
      // Rechecked on every attempt, right before sending.
      const prepared = await this.prepare(row, config, this.now());
      if (!prepared.send) {
        await this.finish(row, {
          status: "suppressed",
          suppressedReason: prepared.reason,
        });
        report.suppressed[prepared.reason] =
          (report.suppressed[prepared.reason] ?? 0) + 1;
        return;
      }

      const { messageId } = await this.send(prepared.message);
      await this.finish(row, {
        status: "sent",
        sentAt: this.now(),
        providerMessageId: messageId ?? null,
        lastError: null,
      });
      report.sent++;
    } catch (error) {
      const message = (
        error instanceof Error ? error.message : String(error)
      ).slice(0, 500);
      const giveUp = row.attempts >= MAX_ATTEMPTS;
      await this.finish(row, {
        status: giveUp ? "failed" : "pending",
        lastError: message,
        nextAttemptAt: new Date(
          this.now().getTime() + retryDelayMs(row.attempts)
        ),
      });
      if (giveUp) report.failed++;
      else report.retrying++;
      console.error(
        `[WeekPassEmails]: ${row.kind} email ${row.id} attempt ${row.attempts} failed${giveUp ? "; giving up" : "; will retry"}: ${message}`
      );
    }
  }

  /**
   * Reports what a live run would do, whatever the switches say, without
   * writing a row or sending anything, so it neither sends nor uses up anyone's
   * eligibility.
   */
  private async dryRun(
    config: WeekPassEmailConfig,
    report: WeekPassEmailReport
  ): Promise<WeekPassEmailReport> {
    const now = this.now();
    const owed = await db
      .select()
      .from(weekPassEmails)
      .where(
        and(
          lte(weekPassEmails.nextAttemptAt, now),
          or(
            eq(weekPassEmails.status, "pending"),
            and(
              eq(weekPassEmails.status, "sending"),
              lt(weekPassEmails.claimedUntil, now)
            )
          )
        )
      );

    const owedKeys = new Set(
      owed.filter((r) => r.kind === "expired").map((r) => r.dedupeKey)
    );
    const candidates = await this.expiredCandidates(config, now);
    const fresh = candidates
      .filter((c) => !owedKeys.has(expiredDedupeKey(c.userId, c.endsAt)))
      .map((c) => ({
        kind: "expired" as const,
        userId: c.userId,
        weekPassId: c.weekPassId,
        accessEndsAt: c.endsAt,
      }));

    for (const c of fresh) {
      report.plan.push({
        kind: "expired",
        userId: c.userId,
        action: "enqueue",
      });
    }
    report.enqueued = fresh.length;

    for (const row of [...owed, ...fresh]) {
      const decision =
        row.kind === "welcome"
          ? await decideWelcome(row, config, now)
          : await decideExpired(row, config, now);
      if (decision.send) {
        report.sent++;
        report.plan.push({
          kind: row.kind,
          userId: row.userId,
          action: "send",
        });
      } else {
        report.suppressed[decision.reason] =
          (report.suppressed[decision.reason] ?? 0) + 1;
        report.plan.push({
          kind: row.kind,
          userId: row.userId,
          action: "suppress",
          reason: decision.reason,
        });
      }
    }
    return report;
  }
}
