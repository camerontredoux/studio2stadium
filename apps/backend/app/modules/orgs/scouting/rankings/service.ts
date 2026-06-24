import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import {
  eventFavorites,
  eventRatings,
  eventNotes,
} from "#database/schema/event-features";
import { eventRosters, eventDancerProfiles } from "#database/schema/org-events";
import { dancerProfiles } from "#database/schema/dancers";
import { and, eq, isNotNull, or, sql } from "drizzle-orm";

@inject()
export class ListRankingsService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, coachRosterId: string) {
    return this.db.use((db) =>
      db
        .select({
          rosterId: eventRosters.id,
          bibNumber: eventRosters.bibNumber,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          organization: eventRosters.organization,
          isRegistered: sql<boolean>`${eventRosters.userId} IS NOT NULL`,
          profilePhotoUrl: eventDancerProfiles.profilePhotoUrl,
          gradYear: sql<
            number | null
          >`COALESCE(${eventDancerProfiles.gradYear}, ${dancerProfiles.gradYear})`,
          gpa: sql<
            number | null
          >`COALESCE(${eventDancerProfiles.gpa}, ${dancerProfiles.gpa})`,
          studio: sql<
            string | null
          >`COALESCE(${eventDancerProfiles.studio}, ${dancerProfiles.studio})`,
          state: eventDancerProfiles.state,
          rating: eventRatings.rating,
          note: eventNotes.content,
          isFavorited: sql<boolean>`(${eventFavorites.id} IS NOT NULL)`,
          favoritedAt: eventFavorites.createdAt,
        })
        .from(eventRosters)
        .leftJoin(
          eventFavorites,
          and(
            eq(eventFavorites.eventId, eventId),
            eq(eventFavorites.coachRosterId, coachRosterId),
            eq(eventFavorites.dancerRosterId, eventRosters.id)
          )
        )
        .leftJoin(
          eventRatings,
          and(
            eq(eventRatings.eventId, eventId),
            eq(eventRatings.coachRosterId, coachRosterId),
            eq(eventRatings.dancerRosterId, eventRosters.id)
          )
        )
        .leftJoin(
          eventNotes,
          and(
            eq(eventNotes.eventId, eventId),
            eq(eventNotes.coachRosterId, coachRosterId),
            eq(eventNotes.dancerRosterId, eventRosters.id)
          )
        )
        .leftJoin(
          eventDancerProfiles,
          eq(eventDancerProfiles.rosterId, eventRosters.id)
        )
        .leftJoin(
          dancerProfiles,
          eq(dancerProfiles.userId, eventRosters.userId)
        )
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, "dancer"),
            eq(eventRosters.isStaff, false),
            or(
              isNotNull(eventFavorites.id),
              isNotNull(eventRatings.id),
              isNotNull(eventNotes.id)
            )
          )
        )
        .orderBy(
          sql`${eventRatings.rating} DESC NULLS LAST`,
          sql`${eventFavorites.createdAt} DESC NULLS LAST`
        )
    );
  }
}
