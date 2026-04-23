import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters, eventDancerProfiles } from "#database/schema/org-events";
import { dancerProfiles } from "#database/schema/dancers";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class ListDancersService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, coachRosterId: string | null, q: Validator) {
    return this.db.use((db) => {
      const filters = [
        eq(eventRosters.eventId, eventId),
        eq(eventRosters.type, "dancer"),
      ];

      if (q.bib !== undefined) {
        filters.push(eq(eventRosters.bibNumber, q.bib));
      } else if (q.search) {
        const pattern = `%${q.search}%`;
        filters.push(
          or(
            ilike(eventRosters.firstName, pattern),
            ilike(eventRosters.lastName, pattern),
            ilike(eventRosters.organization, pattern)
          )!
        );
      }

      const interestedSubquery = coachRosterId
        ? sql<boolean>`EXISTS (
            SELECT 1 FROM event_school_selections ess
            WHERE ess.dancer_roster_id = ${eventRosters.id}
              AND ess.coach_roster_id = ${coachRosterId}
              AND ess.event_id = ${eventId}
          )`
        : sql<boolean>`false`;

      if (q.interested && coachRosterId) {
        filters.push(
          sql`EXISTS (
            SELECT 1 FROM event_school_selections ess
            WHERE ess.dancer_roster_id = ${eventRosters.id}
              AND ess.coach_roster_id = ${coachRosterId}
              AND ess.event_id = ${eventId}
          )`
        );
      }

      return db
        .select({
          rosterId: eventRosters.id,
          bibNumber: eventRosters.bibNumber,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          organization: eventRosters.organization,
          isRegistered: sql<boolean>`${eventRosters.userId} IS NOT NULL`,
          profilePhotoUrl: eventDancerProfiles.profilePhotoUrl,
          gpa: sql<
            number | null
          >`COALESCE(${eventDancerProfiles.gpa}, ${dancerProfiles.gpa})`,
          gradYear: sql<
            number | null
          >`COALESCE(${eventDancerProfiles.gradYear}, ${dancerProfiles.gradYear})`,
          studio: sql<
            string | null
          >`COALESCE(${eventDancerProfiles.studio}, ${dancerProfiles.studio})`,
          state: eventDancerProfiles.state,
          interestedInMySchool: interestedSubquery,
        })
        .from(eventRosters)
        .leftJoin(
          eventDancerProfiles,
          eq(eventDancerProfiles.rosterId, eventRosters.id)
        )
        .leftJoin(
          dancerProfiles,
          eq(dancerProfiles.userId, eventRosters.userId)
        )
        .where(and(...filters))
        .orderBy(eventRosters.bibNumber)
        .limit(q.limit ?? 100)
        .offset(q.offset ?? 0);
    });
  }
}
