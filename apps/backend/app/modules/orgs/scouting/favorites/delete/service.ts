import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventFavorites } from "#database/schema/event-features";
import { and, eq } from "drizzle-orm";

@inject()
export class DeleteFavoriteService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    coachRosterId: string,
    dancerRosterId: string
  ) {
    await this.db.use((db) =>
      db
        .delete(eventFavorites)
        .where(
          and(
            eq(eventFavorites.eventId, eventId),
            eq(eventFavorites.coachRosterId, coachRosterId),
            eq(eventFavorites.dancerRosterId, dancerRosterId)
          )
        )
    );
  }
}
