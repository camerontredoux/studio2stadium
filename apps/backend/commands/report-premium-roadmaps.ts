import { db } from "#database/connection";
import { premiumRoadmaps, subscriptions } from "#database/schema/subscriptions";
import { subscriptionInterval } from "#modules/premium-roadmap/get-roadmap/service";
import { BaseCommand } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import { asc, eq } from "drizzle-orm";

const COLUMNS = [
  "user_id",
  "roadmap_version",
  "cohort_month",
  "interval",
  "premium_started_at",
  "first_viewed_at",
  "profile_completed_at",
  "video_completed_at",
  "program_views_completed_at",
  "tracker_completed_at",
  "favorite_completed_at",
  "roadmap_completed_at",
  "first_renewal_at",
  "first_renewal_reached",
  "active_after_renewal",
] as const;

type ReportRow = Record<(typeof COLUMNS)[number], string>;

/**
 * One row per roadmap member: cohort, interval, each step's first completion,
 * and whether they were still paying after their first renewal date.
 */
export async function premiumRoadmapReport(now = new Date()) {
  const rows = await db
    .select({
      roadmap: premiumRoadmaps,
      priceId: subscriptions.priceId,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(premiumRoadmaps)
    .leftJoin(subscriptions, eq(subscriptions.userId, premiumRoadmaps.userId))
    .orderBy(asc(premiumRoadmaps.premiumStartedAt));

  const iso = (date: Date | null) => date?.toISOString() ?? "";

  return rows.map(
    ({ roadmap, priceId, status, currentPeriodEnd }): ReportRow => {
      const interval = subscriptionInterval(priceId ?? null);
      const start = roadmap.premiumStartedAt;
      let renewal: Date | null = null;
      if (interval) {
        renewal = new Date(start);
        if (interval === "monthly")
          renewal.setUTCMonth(renewal.getUTCMonth() + 1);
        else renewal.setUTCFullYear(renewal.getUTCFullYear() + 1);
      }
      const reached = !!renewal && renewal <= now;
      const active =
        status === "active" && !!currentPeriodEnd && currentPeriodEnd > now;

      return {
        user_id: roadmap.userId,
        roadmap_version: String(roadmap.roadmapVersion),
        cohort_month: start.toISOString().slice(0, 7),
        interval: interval ?? "",
        premium_started_at: iso(start),
        first_viewed_at: iso(roadmap.firstViewedAt),
        profile_completed_at: iso(roadmap.profileCompletedAt),
        video_completed_at: iso(roadmap.videoCompletedAt),
        program_views_completed_at: iso(roadmap.programViewsCompletedAt),
        tracker_completed_at: iso(roadmap.trackerCompletedAt),
        favorite_completed_at: iso(roadmap.favoriteCompletedAt),
        roadmap_completed_at: iso(roadmap.roadmapCompletedAt),
        first_renewal_at: iso(renewal),
        first_renewal_reached: String(reached),
        active_after_renewal: reached ? String(active) : "",
      };
    }
  );
}

export default class ReportPremiumRoadmaps extends BaseCommand {
  static commandName = "report:premium-roadmaps";
  static description =
    "Print the Premium Recruiting Roadmap cohort report as CSV";

  static options: CommandOptions = {
    startApp: true,
  };

  // The postgres-js pool isn't closed when the app terminates, and would
  // keep the process alive.
  async completed() {
    await db.$client.end();
  }

  async run() {
    const rows = await premiumRoadmapReport();
    console.log(COLUMNS.join(","));
    for (const row of rows) console.log(COLUMNS.map((c) => row[c]).join(","));
  }
}
