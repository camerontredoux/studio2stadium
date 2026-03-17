import { dancerProfiles } from "#database/schema/dancers";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { and, count, gte, lt, sql } from "drizzle-orm";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      total,
      dailyCurrent,
      dailyPrevious,
      weeklyCurrent,
      weeklyPrevious,
      monthlyCurrent,
      monthlyPrevious,
      dailyBreakdown,
    ] = await Promise.all([
      // Total dancers
      this.db.use((db) => db.select({ count: count() }).from(dancerProfiles)),

      // DAU - last 24 hours
      this.db.use((db) =>
        db
          .select({ count: count() })
          .from(dancerProfiles)
          .where(gte(dancerProfiles.createdAt, oneDayAgo))
      ),
      // Previous 24 hours
      this.db.use((db) =>
        db
          .select({ count: count() })
          .from(dancerProfiles)
          .where(
            and(
              gte(dancerProfiles.createdAt, twoDaysAgo),
              lt(dancerProfiles.createdAt, oneDayAgo)
            )
          )
      ),

      // WAU - last 7 days
      this.db.use((db) =>
        db
          .select({ count: count() })
          .from(dancerProfiles)
          .where(gte(dancerProfiles.createdAt, oneWeekAgo))
      ),
      // Previous 7 days
      this.db.use((db) =>
        db
          .select({ count: count() })
          .from(dancerProfiles)
          .where(
            and(
              gte(dancerProfiles.createdAt, twoWeeksAgo),
              lt(dancerProfiles.createdAt, oneWeekAgo)
            )
          )
      ),

      // MAU - last 30 days
      this.db.use((db) =>
        db
          .select({ count: count() })
          .from(dancerProfiles)
          .where(gte(dancerProfiles.createdAt, oneMonthAgo))
      ),
      // Previous 30 days
      this.db.use((db) =>
        db
          .select({ count: count() })
          .from(dancerProfiles)
          .where(
            and(
              gte(dancerProfiles.createdAt, twoMonthsAgo),
              lt(dancerProfiles.createdAt, oneMonthAgo)
            )
          )
      ),

      // Daily breakdown for last 30 days
      this.db.use((db) =>
        db
          .select({
            date: sql<string>`date_trunc('day', ${dancerProfiles.createdAt})::date`.as(
              "date"
            ),
            count: count(),
          })
          .from(dancerProfiles)
          .where(gte(dancerProfiles.createdAt, oneMonthAgo))
          .groupBy(sql`date_trunc('day', ${dancerProfiles.createdAt})`)
          .orderBy(sql`date_trunc('day', ${dancerProfiles.createdAt})`)
      ),
    ]);

    return {
      total: total[0]?.count ?? 0,
      daily: this.buildPeriodStats(
        dailyCurrent[0]?.count ?? 0,
        dailyPrevious[0]?.count ?? 0
      ),
      weekly: this.buildPeriodStats(
        weeklyCurrent[0]?.count ?? 0,
        weeklyPrevious[0]?.count ?? 0
      ),
      monthly: this.buildPeriodStats(
        monthlyCurrent[0]?.count ?? 0,
        monthlyPrevious[0]?.count ?? 0
      ),
      dailyBreakdown: dailyBreakdown.map((r) => ({
        date: r.date,
        count: r.count,
      })),
    };
  }

  private buildPeriodStats(current: number, previous: number) {
    const change =
      previous === 0 ? null : ((current - previous) / previous) * 100;
    return { current, previous, change };
  }
}
