import { feed } from "#database/schema/feed";
import { videoUploads, videos } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import env from "#start/env";
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
          mediaId: true,
          type: true,
        },
      })
    );

    if (!video) {
      return { error: "Video not found" };
    }

    // Delete from Cloudflare if it's a Cloudflare video
    if (video.type === "cloudflare") {
      await this.deleteFromCloudflare(video.mediaId);
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

  private async deleteFromCloudflare(mediaId: string) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.get("CLOUDFLARE_ACCOUNT_ID")}/stream/${mediaId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${env.get("CLOUDFLARE_STREAM_TOKEN")}`,
        },
      }
    );

    // 404 is fine - video already deleted from Cloudflare
    if (!response.ok && response.status !== 404) {
      throw new Error(
        `Failed to delete video from Cloudflare: ${response.status}`
      );
    }
  }
}
