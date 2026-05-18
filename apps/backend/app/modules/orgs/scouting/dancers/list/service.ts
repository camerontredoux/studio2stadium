import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters, eventDancerProfiles } from "#database/schema/org-events";
import { eventFavorites, eventRatings, eventNotes, eventCallbacks } from "#database/schema/event-features";
import { dancerProfiles } from "#database/schema/dancers";
import { users } from "#database/schema/users";
import { and, eq, ilike, isNotNull, or, sql } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class ListDancersService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    coachRosterId: string | null,
    q: Validator,
    filterCheckedInOnly: boolean = false,
  ) {
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
            ilike(eventRosters.lastName, pattern)
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

      const isFavoritedSubquery = coachRosterId
        ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${eventFavorites}
            WHERE ${eventFavorites.dancerRosterId} = ${eventRosters.id}
              AND ${eventFavorites.coachRosterId} = ${coachRosterId}
              AND ${eventFavorites.eventId} = ${eventId}
          )`
        : sql<boolean>`false`;

      const ratingSubquery = coachRosterId
        ? sql<number | null>`(
            SELECT ${eventRatings.rating} FROM ${eventRatings}
            WHERE ${eventRatings.dancerRosterId} = ${eventRosters.id}
              AND ${eventRatings.coachRosterId} = ${coachRosterId}
              AND ${eventRatings.eventId} = ${eventId}
            LIMIT 1
          )`
        : sql<number | null>`NULL`;

      const hasNoteSubquery = coachRosterId
        ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${eventNotes}
            WHERE ${eventNotes.dancerRosterId} = ${eventRosters.id}
              AND ${eventNotes.coachRosterId} = ${coachRosterId}
              AND ${eventNotes.eventId} = ${eventId}
          )`
        : sql<boolean>`false`;

      const isCalledBackSubquery = coachRosterId
        ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${eventCallbacks}
            WHERE ${eventCallbacks.dancerRosterId} = ${eventRosters.id}
              AND ${eventCallbacks.coachRosterId} = ${coachRosterId}
              AND ${eventCallbacks.eventId} = ${eventId}
          )`
        : sql<boolean>`false`;

      if (filterCheckedInOnly) {
        filters.push(isNotNull(eventRosters.checkedInAt));
        filters.push(isNotNull(eventRosters.userId));
      }

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
          isFavorited: isFavoritedSubquery,
          rating: ratingSubquery,
          hasNote: hasNoteSubquery,
          isCalledBack: isCalledBackSubquery,
          username: users.username,
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
        .leftJoin(users, eq(users.id, eventRosters.userId))
        .where(and(...filters))
        .orderBy(eventRosters.bibNumber)
        .limit(q.limit ?? 100)
        .offset(q.offset ?? 0);
    });
  }
}
