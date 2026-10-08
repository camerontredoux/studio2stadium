import { trackerItems } from "#database/schema/tracker";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class DeleteTrackerSectionService {
  constructor(private db: DatabaseService) {}

  // Removes the school and everything the dancer tracks under it.
  async execute(dancerId: string, { school }: Validator) {
    await this.db.use((db) =>
      db
        .delete(trackerItems)
        .where(
          and(
            eq(trackerItems.dancerId, dancerId),
            eq(trackerItems.school, school)
          )
        )
    );
  }
}
