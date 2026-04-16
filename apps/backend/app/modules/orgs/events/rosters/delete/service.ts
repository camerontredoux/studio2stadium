import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters } from "#database/schema/org-events";
import { and, eq, inArray } from "drizzle-orm";
import type { Validator } from "./validator.ts";
import type { AuditContext } from "#database/audit";

@inject()
export class DeleteRosterService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, input: Validator, audit: AuditContext) {
    return this.db.withAudit(audit, async (tx, auditLog) => {
      // Read before delete for audit snapshots
      const before = await tx
        .select()
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            inArray(eventRosters.id, input.ids),
          ),
        );

      const deleted = await tx
        .delete(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            inArray(eventRosters.id, input.ids),
          ),
        )
        .returning({ id: eventRosters.id });

      // Log one entry per deleted roster
      for (const row of before) {
        auditLog.log({
          action: "delete",
          resource: "roster",
          resourceId: row.id,
          metadata: {
            before: {
              firstName: row.firstName,
              lastName: row.lastName,
              email: row.email,
              bibNumber: row.bibNumber,
              organization: row.organization,
            },
          },
        });
      }

      return { deletedCount: deleted.length };
    });
  }
}
