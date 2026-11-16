import { sql } from "drizzle-orm";
import * as pg from "drizzle-orm/pg-core";
import { citext, timestamps } from "./helpers/columns.ts";
import { weekPasses } from "./subscriptions.ts";
import { users } from "./users.ts";

/**
 * One row per Week Pass email the platform owes a Dancer, and how its
 * delivery is going. It is a mail queue of its own, not the `outbox`: the
 * outbox feeds SQS for the events worker, which writes notification rows and
 * sends no mail.
 *
 * - welcome: written in the same transaction that records a paid pass, keyed
 *   by the Checkout Session id, so the webhook and the browser return cannot
 *   both owe one.
 * - expired: written by the Week Pass email job once a Dancer's uninterrupted
 *   run of passes has ended, keyed by user and the run's end, so each run is
 *   owed at most one.
 *
 * Delivery is at least once per row, never guaranteed exactly once: a worker
 * that dies after SES accepts a message but before the row is marked sent
 * leaves a lease that a later tick reclaims and sends again.
 */
export const weekPassEmails = pg.pgTable(
  "week_pass_emails",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    kind: pg.text().$type<WeekPassEmailKind>().notNull(),
    dedupeKey: pg.text().notNull(),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // welcome: the pass bought. expired: the pass the run ended with.
    weekPassId: pg
      .uuid()
      .notNull()
      .references(() => weekPasses.id, { onDelete: "cascade" }),
    // expired: when the run ended, as seen when the row was written.
    accessEndsAt: pg.timestamp({ withTimezone: true }),
    status: pg.text().$type<WeekPassEmailStatus>().notNull().default("pending"),
    attempts: pg.integer().notNull().default(0),
    nextAttemptAt: pg.timestamp({ withTimezone: true }).notNull().defaultNow(),
    // A worker's lease on a row it is sending. Another worker may reclaim the
    // row only once `claimedUntil` passes.
    claimToken: pg.uuid(),
    claimedUntil: pg.timestamp({ withTimezone: true }),
    suppressedReason: pg.text(),
    lastError: pg.text(),
    providerMessageId: pg.text(),
    sentAt: pg.timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    pg.uniqueIndex().on(table.kind, table.dedupeKey),
    pg.index().on(table.status, table.nextAttemptAt),
    pg.check(
      "week_pass_emails_kind_check",
      sql`${table.kind} in ('welcome', 'expired')`
    ),
    pg.check(
      "week_pass_emails_status_check",
      sql`${table.status} in ('pending', 'sending', 'sent', 'suppressed', 'failed')`
    ),
  ]
);

export type WeekPassEmailKind = "welcome" | "expired";
export type WeekPassEmailStatus =
  | "pending"
  | "sending"
  | "sent"
  | "suppressed"
  | "failed";

/**
 * Addresses that must not get promotional mail from this platform, recorded
 * from outside it: the Sender list's unsubscribes, bounces and spam reports,
 * the SES account suppression list's bounces and complaints, and explicit
 * removal requests. One row per address per source, so a later import from
 * one source never erases what another recorded. Rows are only ever added or
 * refreshed by `node ace email-suppressions:import`; nothing deletes them.
 * Only the Week Pass emails read it today; `users.notifications` remains the
 * in-app opt-out.
 *
 * Neither Week Pass email will activate until `EMAIL_SUPPRESSION_IMPORTED_AT`
 * records that the history was imported. The import never sets it.
 */
export const emailSuppressions = pg.pgTable(
  "email_suppressions",
  {
    email: citext().notNull(),
    source: pg.text().$type<SuppressionSource>().notNull(),
    reason: pg.text().$type<SuppressionReason>().notNull(),
    // When the source says it happened (unsubscribed_at, bounced_at,
    // LastUpdateTime), when it said so.
    sourceRecordedAt: pg.timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    pg.primaryKey({ columns: [table.email, table.source] }),
    pg.check(
      "email_suppressions_source_check",
      sql`${table.source} in ('sender', 'ses', 'manual')`
    ),
    pg.check(
      "email_suppressions_reason_check",
      sql`${table.reason} in ('unsubscribed', 'bounced', 'complained', 'removal_requested')`
    ),
  ]
);

export type SuppressionSource = "sender" | "ses" | "manual";
export type SuppressionReason =
  | "unsubscribed"
  | "bounced"
  | "complained"
  | "removal_requested";
