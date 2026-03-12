import { outbox } from "#database/schema/notifications";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { and, count, gte, lt, sql } from "drizzle-orm";

type PeriodStats = Record<
  string,
  { current: number; previous: number; change: number | null }
>;

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
      dailyCurrent,
      dailyPrevious,
      weeklyCurrent,
      weeklyPrevious,
      monthlyCurrent,
      monthlyPrevious,
      dailyBreakdown,
    ] = await Promise.all([
      // DAU - last 24 hours
      this.db.use((db) =>
        db
          .select({ type: outbox.type, count: count() })
          .from(outbox)
          .where(gte(outbox.createdAt, oneDayAgo))
          .groupBy(outbox.type)
      ),
      // Previous 24 hours
      this.db.use((db) =>
        db
          .select({ type: outbox.type, count: count() })
          .from(outbox)
          .where(
            and(
              gte(outbox.createdAt, twoDaysAgo),
              lt(outbox.createdAt, oneDayAgo)
            )
          )
          .groupBy(outbox.type)
      ),

      // WAU - last 7 days
      this.db.use((db) =>
        db
          .select({ type: outbox.type, count: count() })
          .from(outbox)
          .where(gte(outbox.createdAt, oneWeekAgo))
          .groupBy(outbox.type)
      ),
      // Previous 7 days
      this.db.use((db) =>
        db
          .select({ type: outbox.type, count: count() })
          .from(outbox)
          .where(
            and(
              gte(outbox.createdAt, twoWeeksAgo),
              lt(outbox.createdAt, oneWeekAgo)
            )
          )
          .groupBy(outbox.type)
      ),

      // MAU - last 30 days
      this.db.use((db) =>
        db
          .select({ type: outbox.type, count: count() })
          .from(outbox)
          .where(gte(outbox.createdAt, oneMonthAgo))
          .groupBy(outbox.type)
      ),
      // Previous 30 days
      this.db.use((db) =>
        db
          .select({ type: outbox.type, count: count() })
          .from(outbox)
          .where(
            and(
              gte(outbox.createdAt, twoMonthsAgo),
              lt(outbox.createdAt, oneMonthAgo)
            )
          )
          .groupBy(outbox.type)
      ),

      // Daily breakdown for last 30 days
      this.db.use((db) =>
        db
          .select({
            type: outbox.type,
            date: sql<string>`date_trunc('day', ${outbox.createdAt})::date`.as(
              "date"
            ),
            count: count(),
          })
          .from(outbox)
          .where(gte(outbox.createdAt, oneMonthAgo))
          .groupBy(outbox.type, sql`date_trunc('day', ${outbox.createdAt})`)
          .orderBy(sql`date_trunc('day', ${outbox.createdAt})`)
      ),
    ]);

    return {
      daily: this.buildPeriodStats(dailyCurrent, dailyPrevious),
      weekly: this.buildPeriodStats(weeklyCurrent, weeklyPrevious),
      monthly: this.buildPeriodStats(monthlyCurrent, monthlyPrevious),
      dailyBreakdown: dailyBreakdown.map((r) => ({
        type: r.type,
        date: r.date,
        count: r.count,
      })),
    };
  }

  private buildPeriodStats(
    current: { type: string; count: number }[],
    previous: { type: string; count: number }[]
  ): PeriodStats {
    const previousMap = new Map(previous.map((r) => [r.type, r.count]));
    const allTypes = new Set([
      ...current.map((r) => r.type),
      ...previous.map((r) => r.type),
    ]);

    const result: PeriodStats = {};
    for (const type of allTypes) {
      const curr = current.find((r) => r.type === type)?.count ?? 0;
      const prev = previousMap.get(type) ?? 0;
      const change = prev === 0 ? null : ((curr - prev) / prev) * 100;
      result[type] = { current: curr, previous: prev, change };
    }
    return result;
  }
}
