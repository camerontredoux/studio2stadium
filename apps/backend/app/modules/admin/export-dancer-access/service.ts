import { dancerProfiles } from "#database/schema/dancers";
import { premiumGrants } from "#database/schema/organizations";
import { subscriptions, weekPasses } from "#database/schema/subscriptions";
import { users } from "#database/schema/users";
import { emailSuppressions } from "#database/schema/week-pass-emails";
import { DatabaseService } from "#database/service";
import {
  GetSubscriptionService,
  type ResolvedAccess,
} from "#modules/subscriptions/get-status/service";
import logger from "@adonisjs/core/services/logger";
import { inject } from "@adonisjs/core";
import { asc, eq, sql } from "drizzle-orm";
import { toCsv, type CsvCell } from "./csv.ts";

/**
 * The columns, in order. Access columns come only from
 * `GetSubscriptionService.resolve`, the same lookup the live app uses to
 * gate features; the stored Stripe/grant/pass dates are context for
 * reconciling expired and inactive Dancers, not a second opinion on access.
 */
export const COLUMNS = [
  "snapshot_at",
  "user_id",
  "username",
  "account_role",
  "first_name",
  "last_name",
  "onboarding_complete",
  "has_dancer_profile",
  "account_created_at",
  "login_email",
  "profile_display_email",
  "display_email_differs_from_login",
  "billing_email",
  "billing_email_status",
  "stripe_customer_id",
  "access_lookup",
  "has_current_access",
  "access_level",
  "current_plan",
  "primary_access_source",
  "active_access_sources",
  "access_ends_at",
  "stripe_subscription_status",
  "stripe_in_payment_grace",
  "stripe_cancel_at_period_end",
  "stripe_stored_period_end",
  "latest_unrevoked_grant_expires_at",
  "latest_week_pass_ends_at",
  "marketing_opt_in",
  "in_app_notifications_setting",
  "email_suppressions",
] as const;

/** The app stores no marketing opt-in, so the export never claims one. */
export const MARKETING_OPT_IN_NOT_RECORDED = "not_recorded_in_app";

/**
 * The app does not store the billing email Stripe holds for a customer
 * (Checkout prefills the display email, but the payer can change it there).
 */
const BILLING_EMAIL_NOT_STORED = "not_stored_in_app_see_stripe_customer";
const NO_STRIPE_CUSTOMER = "no_stripe_customer";

const CONCURRENCY = 8;
const ATTEMPTS = 2;

export interface DancerAccessExport {
  csv: string;
  snapshotAt: Date;
  /** Data rows, one per Dancer account. Equals the SQL count of Dancers. */
  rowCount: number;
  /** Rows whose access lookup failed and say "unknown". */
  failedLookups: number;
}

type DancerRow = Awaited<
  ReturnType<DancerAccessExportService["dancers"]>
>[number];

@inject()
export class DancerAccessExportService {
  constructor(
    private db: DatabaseService,
    private access: GetSubscriptionService
  ) {}

  async execute(now: Date = new Date()): Promise<DancerAccessExport> {
    const dancers = await this.dancers();
    const expected = dancers[0]?.total ?? 0;

    // The window count and the rows come from one statement, so a mismatch
    // means rows were lost; refuse rather than hand over a partial list.
    if (dancers.length !== expected) {
      throw new Error(
        `Dancer access export read ${dancers.length} rows but counted ${expected}`
      );
    }

    const results = await mapConcurrent(dancers, CONCURRENCY, (dancer) =>
      this.lookup(dancer.id, now)
    );

    let failedLookups = 0;
    const rows: CsvCell[][] = [[...COLUMNS]];
    dancers.forEach((dancer, i) => {
      const access = results[i] ?? null;
      if (!access) failedLookups++;
      rows.push(row(dancer, access, now));
    });

    return {
      csv: toCsv(rows),
      snapshotAt: now,
      rowCount: rows.length - 1,
      failedLookups,
    };
  }

  /** The live app's access result, or null when the lookup keeps failing. */
  private async lookup(
    userId: string,
    now: Date
  ): Promise<ResolvedAccess | null> {
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        return await this.access.resolve(userId, now);
      } catch (error) {
        if (attempt === ATTEMPTS) {
          logger.error(
            { err: error, userId },
            "dancer access export: access lookup failed"
          );
        }
      }
    }
    return null;
  }

  /** Every Dancer account, verified or not, with or without a profile. */
  private dancers() {
    return this.db.use((db) =>
      db
        .select({
          total: sql<number>`count(*) over ()`.mapWith(Number),
          id: users.id,
          username: users.username,
          role: users.role,
          firstName: users.firstName,
          lastName: users.lastName,
          verified: users.verified,
          createdAt: users.createdAt,
          loginEmail: users.email,
          displayEmail: users.displayEmail,
          notifications: users.notifications,
          hasProfile: sql<boolean>`${dancerProfiles.id} is not null`,
          customerId: subscriptions.customerId,
          cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
          storedPeriodEnd: subscriptions.currentPeriodEnd,
          latestGrantExpiresAt: sql<Date | null>`(
            select max(${premiumGrants.expiresAt}) from ${premiumGrants}
            where ${premiumGrants.userId} = ${users.id}
              and ${premiumGrants.revokedAt} is null
          )`.mapWith(premiumGrants.expiresAt),
          latestPassEndsAt: sql<Date | null>`(
            select max(${weekPasses.endsAt}) from ${weekPasses}
            where ${weekPasses.userId} = ${users.id}
          )`.mapWith(weekPasses.endsAt),
          suppressions: sql<string | null>`(
            select string_agg(
              ${emailSuppressions.source} || ':' || ${emailSuppressions.reason}
                || ':' || case
                  when ${emailSuppressions.email} = ${users.email} and ${emailSuppressions.email} = ${users.displayEmail}::citext then 'both_emails'
                  when ${emailSuppressions.email} = ${users.email} then 'login_email'
                  else 'display_email'
                end,
              ';' order by ${emailSuppressions.source}, ${emailSuppressions.reason}
            )
            from ${emailSuppressions}
            where ${emailSuppressions.email} = ${users.email}
               or ${emailSuppressions.email} = ${users.displayEmail}::citext
          )`,
        })
        .from(users)
        .leftJoin(dancerProfiles, eq(dancerProfiles.userId, users.id))
        .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
        .where(eq(users.type, "dancer"))
        .orderBy(asc(users.createdAt), asc(users.id))
    );
  }
}

function row(
  dancer: DancerRow,
  access: ResolvedAccess | null,
  now: Date
): CsvCell[] {
  const status = access?.status;
  const sources = access?.activeSources.map((s) => s.source) ?? [];
  const inGrace =
    access !== null &&
    access.subscriptionStatus === "past_due" &&
    sources.includes("stripe");

  return [
    now,
    dancer.id,
    dancer.username,
    dancer.role,
    dancer.firstName,
    dancer.lastName,
    dancer.verified,
    dancer.hasProfile,
    dancer.createdAt,
    dancer.loginEmail,
    dancer.displayEmail,
    dancer.loginEmail.trim().toLowerCase() !==
      dancer.displayEmail.trim().toLowerCase(),
    "",
    dancer.customerId ? BILLING_EMAIL_NOT_STORED : NO_STRIPE_CUSTOMER,
    dancer.customerId,
    access ? "ok" : "failed",
    status ? status.subscribed : "unknown",
    status ? status.access : "unknown",
    status ? status.plan : "unknown",
    status ? status.source : "unknown",
    access ? sources.join(";") || "none" : "unknown",
    status?.currentPeriodEnd ?? null,
    access ? access.subscriptionStatus : "unknown",
    access ? inGrace : "unknown",
    dancer.customerId ? dancer.cancelAtPeriodEnd : null,
    dancer.storedPeriodEnd,
    dancer.latestGrantExpiresAt,
    dancer.latestPassEndsAt,
    MARKETING_OPT_IN_NOT_RECORDED,
    dancer.notifications ? "on" : "off",
    dancer.suppressions,
  ];
}

/** Runs `fn` over `items` with at most `limit` in flight, keeping order. */
async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]!);
      }
    }
  );
  await Promise.all(workers);
  return results;
}
