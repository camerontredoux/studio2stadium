import { trackerItems } from "#database/schema/tracker";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class DeleteTrackerItemService {
  constructor(private db: DatabaseService) {}

  /** Returns false when the item doesn't exist or isn't the dancer's. */
  async execute(dancerId: string, { params }: Validator) {
    const deleted = await this.db.use((db) =>
      db
        .delete(trackerItems)
        .where(
          and(
            eq(trackerItems.id, params.id),
            eq(trackerItems.dancerId, dancerId)
          )
        )
        .returning({ id: trackerItems.id })
    );
    return deleted.length > 0;
  }
}
