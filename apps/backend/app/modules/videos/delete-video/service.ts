import { feed } from "#database/schema/feed";
import { videos } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class DeleteProfileVideoService {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator) {
    const video = await this.db.use((db) =>
      db.query.videos.findFirst({
        where: {
          id: params.id,
        },
        columns: {
          id: true,
        },
      })
    );

    if (!video) {
      return { error: "Video not found" };
    }

    await this.db.tx(async (tx) => {
      await tx.delete(videos).where(eq(videos.id, video.id));
      await tx
        .delete(feed)
        .where(
          and(eq(feed.contentId, video.id), eq(feed.contentType, "video"))
        );
    });
  }
}
