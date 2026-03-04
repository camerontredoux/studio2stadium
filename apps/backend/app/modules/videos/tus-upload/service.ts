import { videos, videoUploads } from "#database/schema/media";
import { subscriptions } from "#database/schema/subscriptions";
import { DatabaseService } from "#database/service";
import env from "#start/env";
import { inject } from "@adonisjs/core";
import { and, count, eq, isNull, ne } from "drizzle-orm";

const VIDEO_LIMIT = 3;

interface InitiateUploadParams {
  userId: string;
  uploadLength: string;
  uploadMetadata: string;
}

type InitiateUploadResult =
  | { location: string; streamMediaId: string }
  | { error: "limit_exceeded"; message: string };

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async initiateUpload(
    params: InitiateUploadParams
  ): Promise<InitiateUploadResult> {
    const { userId, uploadLength, uploadMetadata } = params;

    const [[completedCount], [pendingCount], subscription] = await Promise.all([
      this.db.use((db) =>
        db
          .select({ count: count() })
          .from(videos)
          .where(and(eq(videos.userId, userId), eq(videos.type, "cloudflare")))
      ),
      this.db.use((db) =>
        db
          .select({ count: count() })
          .from(videoUploads)
          .where(
            and(
              eq(videoUploads.userId, userId),
              isNull(videoUploads.videoId),
              ne(videoUploads.status, "failed")
            )
          )
      ),
      this.db.use((db) =>
        db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.userId, userId),
              eq(subscriptions.status, "active")
            )
          )
          .limit(1)
          .then((rows) => rows[0])
      ),
    ]);

    if (!subscription) {
      return {
        error: "limit_exceeded",
        message:
          "Video uploads require a premium subscription. Upgrade to premium to upload videos.",
      };
    }

    const totalVideos = completedCount.count + pendingCount.count;
    if (totalVideos >= VIDEO_LIMIT) {
      return {
        error: "limit_exceeded",
        message: `You can only upload ${VIDEO_LIMIT} videos. Delete an existing video to upload a new one.`,
      };
    }

    // Append maxDurationSeconds to metadata
    const maxDurationMetadata = `maxDurationSeconds ${Buffer.from("120").toString("base64")}`;
    const fullMetadata = uploadMetadata
      ? `${uploadMetadata},${maxDurationMetadata}`
      : maxDurationMetadata;

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.get("CLOUDFLARE_ACCOUNT_ID")}/stream?direct_user=true`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.get("CLOUDFLARE_STREAM_TOKEN")}`,
          "Tus-Resumable": "1.0.0",
          "Upload-Length": uploadLength,
          "Upload-Metadata": fullMetadata,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudflare Stream API error: ${error}`);
    }

    const location = response.headers.get("location");
    const streamMediaId = response.headers.get("stream-media-id");

    if (!location || !streamMediaId) {
      throw new Error(
        "Missing location or stream-media-id in Cloudflare response"
      );
    }

    // Create video upload record
    await this.db.use((db) =>
      db.insert(videoUploads).values({
        userId,
        cloudflareMediaId: streamMediaId,
        status: "pending",
      })
    );

    return { location, streamMediaId };
  }
}
