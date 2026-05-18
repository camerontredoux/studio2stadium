import { DatabaseService } from "#database/service";
import { eventVideos } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { eq, asc } from "drizzle-orm";
import drive from "@adonisjs/drive/services/main";

@inject()
export class ListVideosService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string) {
    const videos = await this.db.use((db) =>
      db
        .select()
        .from(eventVideos)
        .where(eq(eventVideos.eventId, eventId))
        .orderBy(asc(eventVideos.sortOrder), asc(eventVideos.createdAt))
    );

    const disk = drive.use("r2");
    const results = await Promise.all(
      videos.map(async (video) => {
        if (!video.audioKey) {
          return { ...video, audioUrl: null };
        }
        const audioUrl = await disk.getSignedUrl(video.audioKey, {
          expiresIn: "1 hr",
        });
        return { ...video, audioUrl };
      })
    );

    return results;
  }
}
