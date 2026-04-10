import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters } from "#database/schema/org-events";
import { and, eq, inArray } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class DeleteRosterService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, input: Validator) {
    return this.db.use(async (db) => {
      const deleted = await db
        .delete(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            inArray(eventRosters.id, input.ids),
          ),
        )
        .returning({ id: eventRosters.id });
      return { deletedCount: deleted.length };
    });
  }
}
