import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { ROSTER_TYPES } from "#database/schema/enums";
import { orgMemberships } from "#database/schema/organizations";
import { and, eq, inArray } from "drizzle-orm";
import type { Validator } from "./validator.ts";
import type { AuditContext } from "#database/audit";

@inject()
export class DeleteRosterService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    orgId: string,
    input: Validator,
    audit: AuditContext
  ) {
    return this.db.withAudit(audit, async (tx, auditLog) => {
      // Read before delete for audit snapshots
      const before = await tx
        .select()
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            inArray(eventRosters.id, input.ids)
          )
        );

      const deleted = await tx
        .delete(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            inArray(eventRosters.id, input.ids)
          )
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

      // Rescind participant org access for users with no remaining roster
      // entries. An Organizer's membership is never a consequence of a Roster
      // Entry, so it is left alone — removing someone from a roster must not
      // strip the org from the person who runs it (ADR 0003).
      const affectedUserIds = [
        ...new Set(
          before
            .filter((r) => r.userId && !r.isStaff)
            .map((r) => r.userId!)
        ),
      ];

      for (const userId of affectedUserIds) {
        const [remaining] = await tx
          .select({ id: eventRosters.id })
          .from(eventRosters)
          .innerJoin(orgEvents, eq(eventRosters.eventId, orgEvents.id))
          .where(
            and(
              eq(eventRosters.userId, userId),
              eq(orgEvents.orgId, orgId),
              eq(eventRosters.isStaff, false)
            )
          )
          .limit(1);

        if (!remaining) {
          await tx
            .delete(orgMemberships)
            .where(
              and(
                eq(orgMemberships.userId, userId),
                eq(orgMemberships.orgId, orgId),
                eq(orgMemberships.role, "member"),
                inArray(orgMemberships.type, [...ROSTER_TYPES])
              )
            );
        }
      }

      return { deletedCount: deleted.length };
    });
  }
}
