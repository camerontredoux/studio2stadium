import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventNotes } from "#database/schema/event-features";
import { and, eq } from "drizzle-orm";

@inject()
export class DeleteNoteService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    coachRosterId: string,
    dancerRosterId: string
  ) {
    await this.db.use((db) =>
      db
        .delete(eventNotes)
        .where(
          and(
            eq(eventNotes.eventId, eventId),
            eq(eventNotes.coachRosterId, coachRosterId),
            eq(eventNotes.dancerRosterId, dancerRosterId)
          )
        )
    );
  }
}
