import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventCallbacks } from "#database/schema/event-features";
import { and, eq } from "drizzle-orm";

@inject()
export class CreateCallbackService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    showcaseId: string,
    coachRosterId: string,
    dancerRosterId: string
  ) {
    const [row] = await this.db.use((db) =>
      db
        .insert(eventCallbacks)
        .values({ eventId, showcaseId, coachRosterId, dancerRosterId })
        .onConflictDoNothing()
        .returning()
    );

    if (row) return row;

    const [existing] = await this.db.use((db) =>
      db
        .select()
        .from(eventCallbacks)
        .where(
          and(
            eq(eventCallbacks.showcaseId, showcaseId),
            eq(eventCallbacks.coachRosterId, coachRosterId),
            eq(eventCallbacks.dancerRosterId, dancerRosterId)
          )
        )
        .limit(1)
    );
    return existing;
  }
}
