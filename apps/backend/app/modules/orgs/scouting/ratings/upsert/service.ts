import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRatings } from "#database/schema/event-features";
import { sql } from "drizzle-orm";

@inject()
export class UpsertRatingService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    coachRosterId: string,
    dancerRosterId: string,
    rating: number
  ) {
    const [row] = await this.db.use((db) =>
      db
        .insert(eventRatings)
        .values({ eventId, coachRosterId, dancerRosterId, rating })
        .onConflictDoUpdate({
          target: [
            eventRatings.eventId,
            eventRatings.coachRosterId,
            eventRatings.dancerRosterId,
          ],
          set: {
            rating: sql`EXCLUDED.rating`,
            updatedAt: sql`NOW()`,
          },
        })
        .returning()
    );
    return row;
  }
}
