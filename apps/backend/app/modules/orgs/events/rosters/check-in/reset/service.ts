import { DatabaseService } from "#database/service";
import { eventRosters } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq, isNotNull } from "drizzle-orm";
import type { AuditContext } from "#database/audit";

@inject()
export class ResetCheckInService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, audit: AuditContext) {
    return this.db.withAudit(audit, async (tx, auditLog) => {
      const before = await tx
        .select({
          id: eventRosters.id,
          checkedInAt: eventRosters.checkedInAt,
        })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            isNotNull(eventRosters.checkedInAt)
          )
        );

      if (before.length === 0) return { reset: 0 };

      await tx
        .update(eventRosters)
        .set({ checkedInAt: null })
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            isNotNull(eventRosters.checkedInAt)
          )
        );

      for (const row of before) {
        auditLog.log({
          action: "update",
          resource: "roster",
          resourceId: row.id,
          metadata: {
            field: "checkedInAt",
            before: row.checkedInAt,
            after: null,
          },
        });
      }

      return { reset: before.length };
    });
  }
}
