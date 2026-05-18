import { DatabaseService } from "#database/service";
import { eventShowcases } from "#database/schema/event-features";
import { inject } from "@adonisjs/core";
import { asc, eq } from "drizzle-orm";

@inject()
export class ListShowcasesService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string) {
    return this.db.use((db) =>
      db
        .select()
        .from(eventShowcases)
        .where(eq(eventShowcases.eventId, eventId))
        .orderBy(asc(eventShowcases.number))
    );
  }
}
