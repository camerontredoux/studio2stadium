import { DatabaseService } from "#database/service";
import { eventChecklist } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";

@inject()
export class DeleteChecklistService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string, itemId: string) {
    return this.db.use((db) =>
      db
        .delete(eventChecklist)
        .where(and(eq(eventChecklist.id, itemId), eq(eventChecklist.eventId, eventId)))
        .execute()
    );
  }
}
