import { DatabaseService } from "#database/service";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { hasEventStarted } from "#utils/event-time";
import { inject } from "@adonisjs/core";
import { and, asc, desc, eq, sql } from "drizzle-orm";

export interface GetOrgResult {
  org: typeof organizations.$inferSelect;
  membership: {
    role: "admin" | "member";
    type: "coach" | "dancer";
  } | null;
  myRoster: {
    id: string;
    eventId: string;
    type: "coach" | "dancer";
    eventName: string;
    eventStartDate: string;
    eventEndDate: string;
    isActive: boolean;
    hasStarted: boolean;
  } | null;
}

@inject()
export class GetOrgService {
  constructor(private db: DatabaseService) {}

  async execute(
    slug: string,
    userId?: string | null
  ): Promise<GetOrgResult | null> {
    return this.db.use(async (db) => {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);
      if (!org) return null;

      let membership: GetOrgResult["membership"] = null;
      let myRoster: GetOrgResult["myRoster"] = null;
      if (userId) {
        const [row] = await db
          .select({
            role: orgMemberships.role,
            type: orgMemberships.type,
          })
          .from(orgMemberships)
          .where(
            and(
              eq(orgMemberships.orgId, org.id),
              eq(orgMemberships.userId, userId)
            )
          )
          .limit(1);
        if (row) {
          membership = {
            role: row.role as "admin" | "member",
            type: row.type as "coach" | "dancer",
          };
        }

        const today = new Date().toISOString().slice(0, 10);
        const [roster] = await db
          .select({
            id: eventRosters.id,
            eventId: eventRosters.eventId,
            type: eventRosters.type,
            eventName: orgEvents.name,
            eventStartDate: orgEvents.startDate,
            eventEndDate: orgEvents.endDate,
            eventStartTime: orgEvents.startTime,
            eventTimezone: orgEvents.timezone,
            isActive: orgEvents.isActive,
          })
          .from(eventRosters)
          .innerJoin(orgEvents, eq(orgEvents.id, eventRosters.eventId))
          .where(
            and(eq(orgEvents.orgId, org.id), eq(eventRosters.userId, userId))
          )
          .orderBy(
            desc(orgEvents.isActive),
            asc(
              sql`CASE WHEN ${orgEvents.startDate} >= ${today} THEN 0 ELSE 1 END`
            ),
            asc(
              sql`CASE WHEN ${orgEvents.startDate} >= ${today} THEN ${orgEvents.startDate} END`
            ),
            desc(
              sql`CASE WHEN ${orgEvents.startDate} < ${today} THEN ${orgEvents.startDate} END`
            ),
            desc(eventRosters.createdAt)
          )
          .limit(1);
        if (roster) {
          myRoster = {
            id: roster.id,
            eventId: roster.eventId,
            type: roster.type as "coach" | "dancer",
            eventName: roster.eventName,
            eventStartDate: roster.eventStartDate,
            eventEndDate: roster.eventEndDate,
            isActive: roster.isActive,
            hasStarted: hasEventStarted(
              roster.eventStartDate,
              roster.eventStartTime,
              roster.eventTimezone
            ),
          };
        }
      }

      return { org, membership, myRoster };
    });
  }
}
