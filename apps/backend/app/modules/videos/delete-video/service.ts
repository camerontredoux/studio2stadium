import { feed } from "#database/schema/feed";
import { videoUploads, videos } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import { E_NOT_FOUND } from "#exceptions/not-found";
import { deleteStreamVideo } from "#shared/cloudflare/stream";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class DeleteProfileVideoService {
  constructor(private db: DatabaseService) {}

  async execute(userId: string, { params }: Validator) {
    const video = await this.db.use((db) =>
      db.query.videos.findFirst({
        where: {
          id: params.id,
          userId,
        },
        columns: {
          id: true,
          mediaId: true,
          type: true,
        },
      })
    );

    if (!video) {
      throw new E_NOT_FOUND("Video not found");
    }

    // Delete from Cloudflare if it's a Cloudflare video
    if (video.type === "cloudflare") {
      await deleteStreamVideo(video.mediaId);
    }

    await this.db.tx(async (tx) => {
      // Delete videoUploads record if exists
      await tx
        .delete(videoUploads)
        .where(eq(videoUploads.cloudflareMediaId, video.mediaId));

      // Delete video record
      await tx.delete(videos).where(eq(videos.id, video.id));

      // Delete from feed
      await tx
        .delete(feed)
        .where(
          and(eq(feed.contentId, video.id), eq(feed.contentType, "video"))
        );
    });
  }
}
