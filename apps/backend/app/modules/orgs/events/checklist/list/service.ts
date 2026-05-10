import { DatabaseService } from "#database/service";
import { eventChecklist } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { eq, asc } from "drizzle-orm";

@inject()
export class ListChecklistService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string) {
    return this.db.use((db) =>
      db
        .select()
        .from(eventChecklist)
        .where(eq(eventChecklist.eventId, eventId))
        .orderBy(asc(eventChecklist.position), asc(eventChecklist.createdAt))
    );
  }
}
