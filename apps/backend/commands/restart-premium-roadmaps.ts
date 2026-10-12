import { db } from "#database/connection";
import { dancerProfiles } from "#database/schema/dancers";
import { premiumRoadmaps, subscriptions } from "#database/schema/subscriptions";
import {
  paidPremium,
  ROADMAP_VERSION,
} from "#modules/premium-roadmap/get-roadmap/service";
import { BaseCommand, flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import { eq, sql } from "drizzle-orm";

/**
 * Gives every dancer who is Premium now a roadmap whose 30 days start at
 * `startsAt`: creates missing `premium_roadmaps` rows and moves
 * `premium_started_at` forward on existing ones. Step completion timestamps
 * are left alone.
 *
 * A start is only ever moved forward, to `startsAt` or to the member's own
 * later Premium start, so running again with the same `startsAt` changes
 * nothing.
 */
export async function restartPremiumRoadmaps(startsAt: Date, now = new Date()) {
  const members = await db
    .select({
      userId: subscriptions.userId,
      startedAt: subscriptions.startedAt,
    })
    .from(subscriptions)
    .innerJoin(dancerProfiles, eq(dancerProfiles.userId, subscriptions.userId))
    .where(paidPremium(now));

  const changed = members.length
    ? await db
        .insert(premiumRoadmaps)
        .values(
          members.map((row) => ({
            userId: row.userId,
            roadmapVersion: ROADMAP_VERSION,
            // paidPremium requires started_at.
            premiumStartedAt: new Date(
              Math.max(startsAt.getTime(), row.startedAt!.getTime())
            ),
          }))
        )
        .onConflictDoUpdate({
          target: premiumRoadmaps.userId,
          set: { premiumStartedAt: sql.raw("excluded.premium_started_at") },
          setWhere: sql.raw(
            "premium_roadmaps.premium_started_at < excluded.premium_started_at"
          ),
        })
        .returning({ created: sql<boolean>`xmax = 0` })
    : [];

  const created = changed.filter((row) => row.created).length;
  return {
    members: members.length,
    roadmapsCreated: created,
    roadmapsRestarted: changed.length - created,
  };
}

export default class RestartPremiumRoadmaps extends BaseCommand {
  static commandName = "restart:premium-roadmaps";
  static description =
    "Start a fresh 30-day roadmap for every dancer who is Premium now";

  static options: CommandOptions = {
    startApp: true,
  };

  @flags.string({
    description:
      "ISO time the 30 days start (default: now). Pass the time a previous run printed to repeat it without moving anyone's start again.",
  })
  declare startsAt?: string;

  // The postgres-js pool isn't closed when the app terminates, and would
  // keep the process alive.
  async completed() {
    await db.$client.end();
  }

  async run() {
    const now = new Date();
    const startsAt = this.startsAt ? new Date(this.startsAt) : now;
    if (Number.isNaN(startsAt.getTime()) || startsAt > now) {
      this.logger.error("--starts-at must be an ISO time no later than now.");
      this.exitCode = 1;
      return;
    }

    const result = await restartPremiumRoadmaps(startsAt, now);
    this.logger.success(
      `Roadmaps start at ${startsAt.toISOString()} for ${result.members} Premium dancers: created ${result.roadmapsCreated}, restarted ${result.roadmapsRestarted}.`
    );
  }
}
