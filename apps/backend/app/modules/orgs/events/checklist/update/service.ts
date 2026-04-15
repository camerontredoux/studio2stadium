import { DatabaseService } from "#database/service";
import { eventChecklist } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class UpdateChecklistService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string, itemId: string, input: Validator) {
    return this.db.use((db) =>
      db
        .update(eventChecklist)
        .set(input)
        .where(and(eq(eventChecklist.id, itemId), eq(eventChecklist.eventId, eventId)))
        .returning()
    );
  }
}
