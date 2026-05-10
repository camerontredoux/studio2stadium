import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventFavorites } from "#database/schema/event-features";
import { and, eq } from "drizzle-orm";

@inject()
export class CreateFavoriteService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    coachRosterId: string,
    dancerRosterId: string
  ) {
    const [row] = await this.db.use((db) =>
      db
        .insert(eventFavorites)
        .values({ eventId, coachRosterId, dancerRosterId })
        .onConflictDoNothing()
        .returning()
    );

    if (row) return row;

    // Row already existed — fetch and return it
    const [existing] = await this.db.use((db) =>
      db
        .select()
        .from(eventFavorites)
        .where(
          and(
            eq(eventFavorites.eventId, eventId),
            eq(eventFavorites.coachRosterId, coachRosterId),
            eq(eventFavorites.dancerRosterId, dancerRosterId)
          )
        )
        .limit(1)
    );
    return existing;
  }
}
