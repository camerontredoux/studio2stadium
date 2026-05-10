import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventNotes } from "#database/schema/event-features";
import { sql } from "drizzle-orm";

@inject()
export class UpsertNoteService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    coachRosterId: string,
    dancerRosterId: string,
    content: string
  ) {
    const [row] = await this.db.use((db) =>
      db
        .insert(eventNotes)
        .values({ eventId, coachRosterId, dancerRosterId, content })
        .onConflictDoUpdate({
          target: [
            eventNotes.eventId,
            eventNotes.coachRosterId,
            eventNotes.dancerRosterId,
          ],
          set: {
            content: sql`EXCLUDED.content`,
            updatedAt: sql`NOW()`,
          },
        })
        .returning()
    );
    return row;
  }
}
