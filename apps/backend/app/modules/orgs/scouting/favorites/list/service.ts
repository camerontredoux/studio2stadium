import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventFavorites } from "#database/schema/event-features";
import { eventRosters, eventDancerProfiles } from "#database/schema/org-events";
import { dancerProfiles } from "#database/schema/dancers";
import { and, eq, sql } from "drizzle-orm";

@inject()
export class ListFavoritesService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, coachRosterId: string) {
    return this.db.use((db) =>
      db
        .select({
          rosterId: eventRosters.id,
          bibNumber: eventRosters.bibNumber,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          profilePhotoUrl: eventDancerProfiles.profilePhotoUrl,
          gradYear: sql<
            number | null
          >`COALESCE(${eventDancerProfiles.gradYear}, ${dancerProfiles.gradYear})`,
          studio: sql<
            string | null
          >`COALESCE(${eventDancerProfiles.studio}, ${dancerProfiles.studio})`,
          state: eventDancerProfiles.state,
          gpa: sql<
            number | null
          >`COALESCE(${eventDancerProfiles.gpa}, ${dancerProfiles.gpa})`,
        })
        .from(eventFavorites)
        .innerJoin(
          eventRosters,
          eq(eventRosters.id, eventFavorites.dancerRosterId)
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
            eq(eventFavorites.eventId, eventId),
            eq(eventFavorites.coachRosterId, coachRosterId)
          )
        )
        .orderBy(eventFavorites.createdAt)
    );
  }
}
