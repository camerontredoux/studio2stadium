import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRatings } from "#database/schema/event-features";
import { and, eq } from "drizzle-orm";

@inject()
export class DeleteRatingService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    coachRosterId: string,
    dancerRosterId: string
  ) {
    await this.db.use((db) =>
      db
        .delete(eventRatings)
        .where(
          and(
            eq(eventRatings.eventId, eventId),
            eq(eventRatings.coachRosterId, coachRosterId),
            eq(eventRatings.dancerRosterId, dancerRosterId)
          )
        )
    );
  }
}
