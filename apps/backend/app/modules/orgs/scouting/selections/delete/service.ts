import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventSchoolSelections } from "#database/schema/event-features";
import { and, eq } from "drizzle-orm";

@inject()
export class DeleteSelectionService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, dancerRosterId: string, selectionId: string) {
    const [row] = await this.db.use((db) =>
      db
        .delete(eventSchoolSelections)
        .where(
          and(
            eq(eventSchoolSelections.id, selectionId),
            eq(eventSchoolSelections.eventId, eventId),
            eq(eventSchoolSelections.dancerRosterId, dancerRosterId)
          )
        )
        .returning()
    );
    return row ?? null;
  }
}
