import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventDancerProfiles, eventRosters } from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { imageUrl } from "#utils/image-url";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import type { Validator } from "./validator.ts";

const SORT_COLUMNS = {
  lastName: eventRosters.lastName,
  firstName: eventRosters.firstName,
  email: eventRosters.email,
  bibNumber: eventRosters.bibNumber,
  organization: eventRosters.organization,
  createdAt: eventRosters.createdAt,
  isRegistered: sql`(${eventRosters.userId} IS NOT NULL)`,
  checkedInAt: eventRosters.checkedInAt,
} as const;

@inject()
export class ListRosterService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, q: Validator) {
    const page = q.page ?? 0;
    const limit = q.limit ?? 50;
    const sortBy = q.sortBy ?? "lastName";
    const sortDir = q.sortDir ?? "asc";

    const filters = [
      eq(eventRosters.eventId, eventId),
      eq(eventRosters.type, q.type),
      eq(eventRosters.isStaff, false),
    ];

    if (q.search) {
      const pattern = `%${q.search}%`;
      const searchClauses = [
        ilike(eventRosters.firstName, pattern),
        ilike(eventRosters.lastName, pattern),
        ilike(eventRosters.email, pattern),
      ];
      const asNumber = Number(q.search);
      if (Number.isInteger(asNumber) && asNumber > 0) {
        searchClauses.push(eq(eventRosters.bibNumber, asNumber));
      }
      filters.push(or(...searchClauses)!);
    }

    if (q.status === "active") {
      filters.push(isNotNull(eventRosters.userId));
    } else if (q.status === "pending") {
      filters.push(isNull(eventRosters.userId));
    }

    if (q.org) {
      filters.push(eq(eventRosters.organization, q.org));
    }

    const sortColumn = SORT_COLUMNS[sortBy];
    const orderExpr = sortDir === "desc" ? desc(sortColumn) : asc(sortColumn);

    return this.db.use(async (db) => {
      const [rows, totalRow] = await Promise.all([
        db
          .select({
            id: eventRosters.id,
            eventId: eventRosters.eventId,
            type: eventRosters.type,
            email: eventRosters.email,
            firstName: eventRosters.firstName,
            lastName: eventRosters.lastName,
            bibNumber: eventRosters.bibNumber,
            organization: eventRosters.organization,
            isRegistered: sql<boolean>`(${eventRosters.userId} IS NOT NULL)`,
            createdAt: eventRosters.createdAt,
            profilePhotoUrl: eventDancerProfiles.profilePhotoUrl,
            gradYear: eventDancerProfiles.gradYear,
            gpa: eventDancerProfiles.gpa,
            studio: eventDancerProfiles.studio,
            state: eventDancerProfiles.state,
            height: eventDancerProfiles.height,
            danceStyles: eventDancerProfiles.danceStyles,
            bio: eventDancerProfiles.bio,
            checkedInAt: eventRosters.checkedInAt,
            paid: eventRosters.paid,
            linkedUserId: users.id,
            linkedUserEmail: users.email,
            linkedUserFirstName: users.firstName,
            linkedUserLastName: users.lastName,
            linkedUserAvatar: users.avatar,
          })
          .from(eventRosters)
          .leftJoin(
            eventDancerProfiles,
            eq(eventDancerProfiles.rosterId, eventRosters.id)
          )
          .leftJoin(users, eq(users.id, eventRosters.userId))
          .where(and(...filters))
          .orderBy(orderExpr)
          .limit(limit)
          .offset(page * limit),
        db
          .select({ v: count() })
          .from(eventRosters)
          .where(and(...filters)),
      ]);

      return {
        data: rows.map((r) => ({
          id: r.id,
          eventId: r.eventId,
          type: r.type,
          email: r.email,
          firstName: r.firstName,
          lastName: r.lastName,
          bibNumber: r.bibNumber,
          organization: r.organization,
          isRegistered: r.isRegistered,
          checkedInAt: r.checkedInAt?.toISOString() ?? null,
          paid: r.paid,
          // The account this entry currently belongs to. The roster's own
          // email/name are rewritten to match on attach, so they cannot be
          // relied on to show who actually holds the entry.
          linkedUser: r.linkedUserId
            ? {
                id: r.linkedUserId,
                email: r.linkedUserEmail!,
                firstName: r.linkedUserFirstName,
                lastName: r.linkedUserLastName,
                avatarUrl: imageUrl(r.linkedUserAvatar, "avatar"),
              }
            : null,
          createdAt:
            r.createdAt instanceof Date
              ? r.createdAt.toISOString()
              : String(r.createdAt),
          profile:
            r.type === "dancer"
              ? {
                  profilePhotoUrl: r.profilePhotoUrl,
                  gradYear: r.gradYear,
                  gpa: r.gpa,
                  studio: r.studio,
                  state: r.state,
                  height: r.height,
                  danceStyles: r.danceStyles,
                  bio: r.bio,
                }
              : null,
        })),
        total: Number(totalRow[0]?.v ?? 0),
      };
    });
  }
}
