import { DatabaseService } from "#database/service";
import { eventVideos } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { eq, asc } from "drizzle-orm";

@inject()
export class ListVideosService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string) {
    return this.db.use((db) =>
      db
        .select()
        .from(eventVideos)
        .where(eq(eventVideos.eventId, eventId))
        .orderBy(asc(eventVideos.sortOrder), asc(eventVideos.createdAt))
    );
  }
}
