import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters, eventDancerProfiles } from "#database/schema/org-events";
import { dancerProfiles } from "#database/schema/dancers";
import {
  eventFavorites,
  eventNotes,
  eventRatings,
} from "#database/schema/event-features";
import { and, eq, sql } from "drizzle-orm";

@inject()
export class GetDancerByIdService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    dancerRosterId: string,
    coachRosterId: string | null
  ) {
    const rows = await this.db.use((db) =>
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
          height: eventDancerProfiles.height,
          danceStyles: eventDancerProfiles.danceStyles,
          bio: eventDancerProfiles.bio,
          extra: eventDancerProfiles.extra,
          highSchool: dancerProfiles.highSchool,
          location: dancerProfiles.location,
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
        .where(
          and(
            eq(eventRosters.id, dancerRosterId),
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, "dancer")
          )
        )
        .limit(1)
    );

    if (rows.length === 0) return null;

    const dancer = rows[0];

    let note: string | null = null;
    let rating: number | null = null;
    let isFavorited = false;

    if (coachRosterId !== null) {
      const [noteRow, ratingRow, favoriteRow] = await Promise.all([
        this.db.use((db) =>
          db
            .select({ content: eventNotes.content })
            .from(eventNotes)
            .where(
              and(
                eq(eventNotes.eventId, eventId),
                eq(eventNotes.coachRosterId, coachRosterId),
                eq(eventNotes.dancerRosterId, dancerRosterId)
              )
            )
            .limit(1)
        ),
        this.db.use((db) =>
          db
            .select({ rating: eventRatings.rating })
            .from(eventRatings)
            .where(
              and(
                eq(eventRatings.eventId, eventId),
                eq(eventRatings.coachRosterId, coachRosterId),
                eq(eventRatings.dancerRosterId, dancerRosterId)
              )
            )
            .limit(1)
        ),
        this.db.use((db) =>
          db
            .select({ id: eventFavorites.id })
            .from(eventFavorites)
            .where(
              and(
                eq(eventFavorites.eventId, eventId),
                eq(eventFavorites.coachRosterId, coachRosterId),
                eq(eventFavorites.dancerRosterId, dancerRosterId)
              )
            )
            .limit(1)
        ),
      ]);

      note = noteRow[0]?.content ?? null;
      rating = ratingRow[0]?.rating ?? null;
      isFavorited = favoriteRow.length > 0;
    }

    return {
      ...dancer,
      note,
      rating,
      isFavorited,
      favoritedMyRosterId: null,
    };
  }
}
