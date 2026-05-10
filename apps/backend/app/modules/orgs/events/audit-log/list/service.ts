import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventAuditLog } from "#database/schema/org-events";
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

    const actorAlias = users;

    const searchFilters = [...filters];
    if (q.search) {
      const pattern = `%${q.search}%`;
      searchFilters.push(
        sql`(${actorAlias.firstName} ilike ${pattern} or ${actorAlias.lastName} ilike ${pattern} or ${actorAlias.email} ilike ${pattern})`
      );
    }

    const orderExpr =
      sortDir === "asc"
        ? asc(eventAuditLog.createdAt)
        : desc(eventAuditLog.createdAt);

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
            childCount: sql<number>`(
              select count(*)::int from event_audit_log c
              where c.parent_id = ${eventAuditLog.id}
            )`,
          })
          .from(eventAuditLog)
          .innerJoin(users, eq(users.id, eventAuditLog.actorId))
          .where(and(...searchFilters))
          .orderBy(orderExpr)
          .limit(limit)
          .offset(page * limit),
        db
          .select({ v: count() })
          .from(eventAuditLog)
          .innerJoin(users, eq(users.id, eventAuditLog.actorId))
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
          childCount: r.childCount,
        })),
        total: Number(totalRow[0]?.v ?? 0),
      };
    });
  }
}
