import { DatabaseService } from "#database/service";
import { eventChecklist } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { eq, sql } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class CreateChecklistService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string, input: Validator) {
    return this.db.use(async (db) => {
      const [row] = await db
        .select({ maxPos: sql<number>`max(${eventChecklist.position})` })
        .from(eventChecklist)
        .where(eq(eventChecklist.eventId, eventId));
      const maxPos = row?.maxPos ?? -1;
      const [item] = await db
        .insert(eventChecklist)
        .values({
          eventId,
          title: input.title,
          description: input.description,
          position: maxPos + 1,
        })
        .returning();
      return item!;
    });
  }
}
