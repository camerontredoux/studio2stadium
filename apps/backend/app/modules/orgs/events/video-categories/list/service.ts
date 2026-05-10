import { DatabaseService } from "#database/service";
import { eventVideoCategories } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { eq, asc } from "drizzle-orm";

@inject()
export class ListVideoCategoriesService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string) {
    return this.db.use((db) =>
      db
        .select()
        .from(eventVideoCategories)
        .where(eq(eventVideoCategories.eventId, eventId))
        .orderBy(
          asc(eventVideoCategories.sortOrder),
          asc(eventVideoCategories.createdAt)
        )
    );
  }
}
