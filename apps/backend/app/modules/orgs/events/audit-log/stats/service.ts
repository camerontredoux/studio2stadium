import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventAuditLog } from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { and, eq, isNull, sql } from "drizzle-orm";

@inject()
export class AuditLogStatsService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string) {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);
    startOfMonth.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    // postgres.js cannot serialize Date objects inside sql`` FILTER clauses —
    // convert to ISO strings so they pass as text parameters.
    const todayStr = startOfToday.toISOString();
    const weekStr = startOfWeek.toISOString();
    const monthStr = startOfMonth.toISOString();
    const sevenDaysStr = sevenDaysAgo.toISOString();

    return this.db.use(async (db) => {
      const [activityRow, topActorsRows, uploadHealthRow, actionBreakdownRows] =
        await Promise.all([
          // Activity counts (today / this week / this month) — top-level entries only
          db
            .select({
              today: sql<number>`count(*) filter (where ${eventAuditLog.createdAt} >= ${todayStr})::int`,
              thisWeek: sql<number>`count(*) filter (where ${eventAuditLog.createdAt} >= ${weekStr})::int`,
              thisMonth: sql<number>`count(*) filter (where ${eventAuditLog.createdAt} >= ${monthStr})::int`,
              recentErrors: sql<number>`count(*) filter (where
                ${eventAuditLog.createdAt} >= ${sevenDaysStr}
                and ${eventAuditLog.metadata}->>'error' is not null
              )::int`,
            })
            .from(eventAuditLog)
            .where(
              and(
                eq(eventAuditLog.eventId, eventId),
                isNull(eventAuditLog.parentId)
              )
            ),

          // Top 5 actors by action count
          db
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              avatarUrl: users.avatar,
              count: sql<number>`count(${eventAuditLog.id})::int`,
            })
            .from(eventAuditLog)
            .innerJoin(users, eq(users.id, eventAuditLog.actorId))
            .where(
              and(
                eq(eventAuditLog.eventId, eventId),
                isNull(eventAuditLog.parentId)
              )
            )
            .groupBy(users.id, users.firstName, users.lastName, users.avatar)
            .orderBy(sql`count(${eventAuditLog.id}) desc`)
            .limit(5),

          // Upload health: csv_upload entries
          db
            .select({
              total: sql<number>`count(*)::int`,
              errored: sql<number>`count(*) filter (where
                (${eventAuditLog.metadata}->>'rowsErrored')::int > 0
              )::int`,
              totalRows: sql<number>`coalesce(sum((${eventAuditLog.metadata}->>'rowsAdded')::int + (${eventAuditLog.metadata}->>'rowsUpdated')::int + coalesce((${eventAuditLog.metadata}->>'rowsErrored')::int, 0)), 0)::int`,
              erroredRows: sql<number>`coalesce(sum((${eventAuditLog.metadata}->>'rowsErrored')::int), 0)::int`,
            })
            .from(eventAuditLog)
            .where(
              and(
                eq(eventAuditLog.eventId, eventId),
                eq(eventAuditLog.resource, "csv_upload")
              )
            ),

          // Action breakdown
          db
            .select({
              action: eventAuditLog.action,
              count: sql<number>`count(*)::int`,
            })
            .from(eventAuditLog)
            .where(
              and(
                eq(eventAuditLog.eventId, eventId),
                isNull(eventAuditLog.parentId)
              )
            )
            .groupBy(eventAuditLog.action)
            .orderBy(sql`count(*) desc`),
        ]);

      const activity = activityRow[0] ?? {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        recentErrors: 0,
      };

      const uploadHealth = uploadHealthRow[0] ?? {
        total: 0,
        errored: 0,
        totalRows: 0,
        erroredRows: 0,
      };

      const successRate =
        uploadHealth.total > 0
          ? Math.round(
              ((uploadHealth.total - uploadHealth.errored) /
                uploadHealth.total) *
                100
            )
          : 100;

      return {
        activity: {
          today: activity.today,
          thisWeek: activity.thisWeek,
          thisMonth: activity.thisMonth,
        },
        topActors: topActorsRows.map((r) => ({
          id: r.id,
          name: `${r.firstName} ${r.lastName}`,
          avatarUrl: r.avatarUrl,
          count: r.count,
        })),
        recentErrors: activity.recentErrors,
        uploadHealth: {
          total: uploadHealth.total,
          successRate,
          totalRows: uploadHealth.totalRows,
          erroredRows: uploadHealth.erroredRows,
        },
        actionBreakdown: actionBreakdownRows.map((r) => ({
          action: r.action,
          count: r.count,
        })),
      };
    });
  }
}
