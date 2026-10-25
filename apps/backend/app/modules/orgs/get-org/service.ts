import type { OrgMemberType, RosterType } from "#database/schema/enums";
import { resolveEffectiveMembership } from "#shared/org/membership";
import { DatabaseService } from "#database/service";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import {
  hasEventStarted,
  orgDefaultTimezone,
  resolveEventZone,
  todayInZone,
} from "#utils/event-time";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";

export interface OrgRosterSummary {
  id: string;
  eventId: string;
  type: RosterType;
  eventName: string;
  eventStartDate: string;
  eventEndDate: string;
  isActive: boolean;
  hasStarted: boolean;
}

export interface GetOrgResult {
  org: typeof organizations.$inferSelect;
  /**
   * The user's highest-privilege membership. A person may hold both an
   * organizer and a coach membership in the same Org (ADR 0003).
   */
  membership: {
    role: "admin" | "member";
    type: OrgMemberType;
  } | null;
  myRoster: OrgRosterSummary | null;
  myRosters: OrgRosterSummary[];
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
      let myRosters: GetOrgResult["myRosters"] = [];
      if (userId) {
        const membershipRows = await db
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
          );
        membership = resolveEffectiveMembership(membershipRows);

        const orgDefault = orgDefaultTimezone(org.settings);
        const rosterRows = await db
          .select({
            id: eventRosters.id,
            eventId: eventRosters.eventId,
            type: eventRosters.type,
            createdAt: eventRosters.createdAt,
            eventName: orgEvents.name,
            eventStartDate: orgEvents.startDate,
            eventEndDate: orgEvents.endDate,
            eventStartTime: orgEvents.startTime,
            eventEndTime: orgEvents.endTime,
            eventTimezone: orgEvents.timezone,
            isActive: orgEvents.isActive,
          })
          .from(eventRosters)
          .innerJoin(orgEvents, eq(orgEvents.id, eventRosters.eventId))
          .where(
            and(eq(orgEvents.orgId, org.id), eq(eventRosters.userId, userId))
          );

        // Active event first, then upcoming ones soonest first, then past ones
        // latest first, then the newest Roster Entry. "Upcoming" means the
        // start date is today or later in the event's own zone.
        const now = Date.now();
        const sorted = rosterRows
          .map((roster) => ({
            roster,
            upcoming:
              roster.eventStartDate >=
              todayInZone(
                resolveEventZone(roster.eventTimezone, orgDefault),
                now
              ),
          }))
          .sort((a, b) => {
            if (a.roster.isActive !== b.roster.isActive) {
              return a.roster.isActive ? -1 : 1;
            }
            if (a.upcoming !== b.upcoming) return a.upcoming ? -1 : 1;
            const byStart = a.roster.eventStartDate.localeCompare(
              b.roster.eventStartDate
            );
            if (byStart !== 0) return a.upcoming ? byStart : -byStart;
            return b.roster.createdAt.getTime() - a.roster.createdAt.getTime();
          });

        myRosters = sorted.map(({ roster }) => ({
          id: roster.id,
          eventId: roster.eventId,
          type: roster.type,
          eventName: roster.eventName,
          eventStartDate: roster.eventStartDate,
          eventEndDate: roster.eventEndDate,
          isActive: roster.isActive,
          hasStarted: hasEventStarted(
            {
              startDate: roster.eventStartDate,
              endDate: roster.eventEndDate,
              startTime: roster.eventStartTime,
              endTime: roster.eventEndTime,
              timezone: roster.eventTimezone,
            },
            orgDefault,
            now
          ),
        }));
        myRoster = myRosters[0] ?? null;
      }

      return { org, membership, myRoster, myRosters };
    });
  }
}
