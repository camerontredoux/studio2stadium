import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventCallbacks } from "#database/schema/event-features";
import { and, eq } from "drizzle-orm";

@inject()
export class DeleteCallbackService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    showcaseId: string,
    coachRosterId: string,
    dancerRosterId: string
  ) {
    await this.db.use((db) =>
      db
        .delete(eventCallbacks)
        .where(
          and(
            eq(eventCallbacks.showcaseId, showcaseId),
            eq(eventCallbacks.coachRosterId, coachRosterId),
            eq(eventCallbacks.dancerRosterId, dancerRosterId)
          )
        )
    );
  }
}
