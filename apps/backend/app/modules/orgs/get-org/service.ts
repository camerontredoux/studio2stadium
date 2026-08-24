import type { OrgMemberType, RosterType } from "#database/schema/enums";
import { resolveEffectiveMembership } from "#shared/org/membership";
import { DatabaseService } from "#database/service";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import {
  EVENT_TIER_DEFINITIONS,
  type EventTierCapability,
} from "#shared/org/event-tiers";
import { hasEventStarted } from "#utils/event-time";
import { inject } from "@adonisjs/core";
import { and, asc, desc, eq, sql } from "drizzle-orm";

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
  /**
   * What the Org's active Org Event includes, or `null` when it has no active
   * event — which is not the same answer as an active event that includes
   * nothing, and a client that cannot tell them apart would fall back to the
   * Org's flags.
   *
   * Entitlement is bought per event (ADR 0002), so the frontend's convenience
   * gating asks this rather than `org.features`. Sent resolved rather than as a
   * bare Event Tier so that the mapping from sold name to capabilities stays in
   * `#shared/org/event-tiers` alone and no client can drift from it.
   */
  activeEventCapabilities: EventTierCapability[] | null;
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

      const [activeEvent] = await db
        .select({ eventTier: orgEvents.eventTier })
        .from(orgEvents)
        .where(and(eq(orgEvents.orgId, org.id), eq(orgEvents.isActive, true)))
        .limit(1);
      const activeEventCapabilities = activeEvent
        ? [...EVENT_TIER_DEFINITIONS[activeEvent.eventTier].capabilities]
        : null;

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

        const today = new Date().toISOString().slice(0, 10);
        const rosterRows = await db
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
          );
        myRosters = rosterRows.map((roster) => ({
          id: roster.id,
          eventId: roster.eventId,
          type: roster.type,
          eventName: roster.eventName,
          eventStartDate: roster.eventStartDate,
          eventEndDate: roster.eventEndDate,
          isActive: roster.isActive,
          hasStarted: hasEventStarted(
            roster.eventStartDate,
            roster.eventStartTime,
            roster.eventTimezone
          ),
        }));
        myRoster = myRosters[0] ?? null;
      }

      return {
        org,
        membership,
        myRoster,
        myRosters,
        activeEventCapabilities,
      };
    });
  }
}
