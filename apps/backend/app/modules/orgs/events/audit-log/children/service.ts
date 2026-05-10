import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventAuditLog } from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { asc, eq } from "drizzle-orm";

@inject()
export class ListAuditLogChildrenService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(_eventId: string, entryId: string) {
    return this.db.use(async (db) => {
      const rows = await db
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
        })
        .from(eventAuditLog)
        .innerJoin(users, eq(users.id, eventAuditLog.actorId))
        .where(eq(eventAuditLog.parentId, entryId))
        .orderBy(asc(eventAuditLog.createdAt));

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
        })),
      };
    });
  }
}
