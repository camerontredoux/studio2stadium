import { feed } from "#database/schema/feed";
import { videoUploads, videos } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import env from "#start/env";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import {
  invalidateSchoolProfileCache,
  resolveSchoolUserByUsername,
} from "../resolve-school-user.ts";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator) {
    const resolved = await resolveSchoolUserByUsername(
      this.db,
      params.username
    );
    if (!resolved.ok) {
      return { error: resolved.error };
    }

    const video = await this.db.use((db) =>
      db.query.videos.findFirst({
        where: {
          id: params.id,
          userId: resolved.school.userId,
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

    if (video.type === "cloudflare") {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.get("CLOUDFLARE_ACCOUNT_ID")}/stream/${video.mediaId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${env.get("CLOUDFLARE_STREAM_TOKEN")}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        throw new Error(
          `Failed to delete video from Cloudflare: ${response.status}`
        );
      }
    }

    await this.db.tx(async (tx) => {
      await tx
        .delete(videoUploads)
        .where(eq(videoUploads.cloudflareMediaId, video.mediaId));
      await tx.delete(videos).where(eq(videos.id, video.id));
      await tx
        .delete(feed)
        .where(
          and(eq(feed.contentId, video.id), eq(feed.contentType, "video"))
        );
    });

    await invalidateSchoolProfileCache(resolved.school.username);

    return { success: true };
  }
}
