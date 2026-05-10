import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventCallbacks } from "#database/schema/event-features";
import { and, eq } from "drizzle-orm";

@inject()
export class DeleteCallbackService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    coachRosterId: string,
    dancerRosterId: string
  ) {
    await this.db.use((db) =>
      db
        .delete(eventCallbacks)
        .where(
          and(
            eq(eventCallbacks.eventId, eventId),
            eq(eventCallbacks.coachRosterId, coachRosterId),
            eq(eventCallbacks.dancerRosterId, dancerRosterId)
          )
        )
    );
  }
}
