import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import {
  eventAuditLog,
  eventDancerProfiles,
  eventRosters,
} from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { imageUrl } from "#utils/image-url";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
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

    if (q.actions?.length) {
      // COALESCE: an entry without a `field` key makes the comparison NULL,
      // and `not NULL` would drop it from Update as well.
      const isCheckIn = sql`coalesce(${eventAuditLog.action} = 'update'
        and ${eventAuditLog.resource} = 'roster'
        and ${eventAuditLog.metadata}->>'field' = 'checkedInAt', false)`;
      const plain = q.actions.filter((a) => a !== "check_in");
      const matches = [];
      if (q.actions.includes("check_in")) matches.push(isCheckIn);
      if (plain.length) {
        matches.push(
          plain.includes("update")
            ? and(inArray(eventAuditLog.action, plain), sql`not ${isCheckIn}`)
            : inArray(eventAuditLog.action, plain)
        );
      }
      filters.push(or(...matches)!);
    }

    if (q.resources?.length) {
      filters.push(inArray(eventAuditLog.resource, q.resources));
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
    // Entries written in the same instant need a fixed order to page by offset.
    const tieBreak =
      sortDir === "asc" ? asc(eventAuditLog.id) : desc(eventAuditLog.id);

    // `resourceId` is polymorphic, so the join has to be narrowed to the rows
    // where it actually points at a roster entry.
    const subjectUsers = alias(users, "subject_users");
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
            subjectPhotoUrl: eventDancerProfiles.profilePhotoUrl,
            subjectAvatar: subjectUsers.avatar,
            childCount: sql<number>`(
              select count(*)::int from event_audit_log c
              where c.parent_id = ${eventAuditLog.id}
            )`,
          })
          .from(eventAuditLog)
          .innerJoin(users, eq(users.id, eventAuditLog.actorId))
          .leftJoin(eventRosters, subjectJoin)
          .leftJoin(
            eventDancerProfiles,
            eq(eventDancerProfiles.rosterId, eventRosters.id)
          )
          .leftJoin(subjectUsers, eq(subjectUsers.id, eventRosters.userId))
          .where(and(...searchFilters))
          .orderBy(orderExpr, tieBreak)
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
            avatarUrl: imageUrl(r.actorAvatar, "avatar"),
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
                avatarUrl:
                  r.subjectPhotoUrl ?? imageUrl(r.subjectAvatar, "avatar"),
              }
            : null,
          childCount: r.childCount,
        })),
        total: Number(totalRow[0]?.v ?? 0),
      };
    });
  }
}
