import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventAuditLog, eventRosters } from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { and, asc, count, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class ListAuditLogService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, q: Validator) {
    const page = q.page ?? 0;
    const limit = q.limit ?? 50;
    const sortDir = q.sortDir ?? "desc";

    const filters = [
      eq(eventAuditLog.eventId, eventId),
      isNull(eventAuditLog.parentId),
    ];

    if (q.action) {
      filters.push(eq(eventAuditLog.action, q.action));
    }

    if (q.resource) {
      filters.push(eq(eventAuditLog.resource, q.resource));
    }

    if (q.actorId) {
      filters.push(eq(eventAuditLog.actorId, q.actorId));
    }

    if (q.from) {
      filters.push(gte(eventAuditLog.createdAt, new Date(q.from)));
    }

    if (q.to) {
      filters.push(lte(eventAuditLog.createdAt, new Date(q.to)));
    }

    const searchFilters = [...filters];
    if (q.search) {
      const pattern = `%${q.search}%`;
      // Matches the actor, the dancer the entry is about, and any identity the
      // entry recorded at the time. That last part is what makes an entry
      // findable by an address the roster no longer carries: attaching an
      // account rewrites the roster's email in place, so searching for the
      // address a dancer was originally uploaded under would otherwise return
      // nothing — precisely when you most need the history.
      searchFilters.push(
        sql`(
          ${users.firstName} ilike ${pattern}
          or ${users.lastName} ilike ${pattern}
          or ${users.email} ilike ${pattern}
          or ${eventRosters.firstName} ilike ${pattern}
          or ${eventRosters.lastName} ilike ${pattern}
          or ${eventRosters.email} ilike ${pattern}
          or ${eventAuditLog.metadata}->'before'->>'email' ilike ${pattern}
          or ${eventAuditLog.metadata}->'after'->>'email' ilike ${pattern}
          or ${eventAuditLog.metadata}->>'previousEmail' ilike ${pattern}
          or ${eventAuditLog.metadata}->>'newEmail' ilike ${pattern}
          or (
            ${eventAuditLog.resource} = 'csv_upload'
            and exists (
              select 1 from csv_upload_rows cur
              where cur.csv_upload_id = ${eventAuditLog.resourceId}
                and cur.email ilike ${pattern}
            )
          )
        )`
      );
    }

    const orderExpr =
      sortDir === "asc"
        ? asc(eventAuditLog.createdAt)
        : desc(eventAuditLog.createdAt);

    // `resourceId` is polymorphic, so the join has to be narrowed to the rows
    // where it actually points at a roster entry.
    const subjectJoin = and(
      eq(eventAuditLog.resourceId, eventRosters.id),
      eq(eventAuditLog.resource, "roster")
    );

    return this.db.use(async (db) => {
      const [rows, totalRow] = await Promise.all([
        db
          .select({
            id: eventAuditLog.id,
            eventId: eventAuditLog.eventId,
            action: eventAuditLog.action,
            resource: eventAuditLog.resource,
            resourceId: eventAuditLog.resourceId,
            metadata: eventAuditLog.metadata,
            parentId: eventAuditLog.parentId,
            createdAt: eventAuditLog.createdAt,
            actorId: eventAuditLog.actorId,
            actorFirstName: users.firstName,
            actorLastName: users.lastName,
            actorEmail: users.email,
            actorAvatar: users.avatar,
            subjectRosterId: eventRosters.id,
            subjectFirstName: eventRosters.firstName,
            subjectLastName: eventRosters.lastName,
            subjectEmail: eventRosters.email,
            subjectBibNumber: eventRosters.bibNumber,
            childCount: sql<number>`(
              select count(*)::int from event_audit_log c
              where c.parent_id = ${eventAuditLog.id}
            )`,
          })
          .from(eventAuditLog)
          .innerJoin(users, eq(users.id, eventAuditLog.actorId))
          .leftJoin(eventRosters, subjectJoin)
          .where(and(...searchFilters))
          .orderBy(orderExpr)
          .limit(limit)
          .offset(page * limit),
        db
          .select({ v: count() })
          .from(eventAuditLog)
          .innerJoin(users, eq(users.id, eventAuditLog.actorId))
          .leftJoin(eventRosters, subjectJoin)
          .where(and(...searchFilters)),
      ]);

      return {
        data: rows.map((r) => ({
          id: r.id,
          eventId: r.eventId,
          action: r.action,
          resource: r.resource,
          resourceId: r.resourceId,
          metadata: r.metadata,
          parentId: r.parentId,
          createdAt:
            r.createdAt instanceof Date
              ? r.createdAt.toISOString()
              : String(r.createdAt),
          actor: {
            id: r.actorId,
            firstName: r.actorFirstName,
            lastName: r.actorLastName,
            email: r.actorEmail,
            avatarUrl: r.actorAvatar,
          },
          // Who the entry is about, when that is a roster entry. Null for
          // event/checklist/video rows, and for roster entries that have since
          // been deleted.
          subject: r.subjectRosterId
            ? {
                rosterId: r.subjectRosterId,
                firstName: r.subjectFirstName,
                lastName: r.subjectLastName,
                email: r.subjectEmail,
                bibNumber: r.subjectBibNumber,
              }
            : null,
          childCount: r.childCount,
        })),
        total: Number(totalRow[0]?.v ?? 0),
      };
    });
  }
}
