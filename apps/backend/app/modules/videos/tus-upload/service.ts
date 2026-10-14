import { dancerProfiles } from "#database/schema/dancers";
import { videos, videoUploads } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import { GetMediaPermissionsService } from "#modules/media/permissions/service";
import { streamUploadHeaders } from "#shared/cloudflare/stream";
import env from "#start/env";
import { inject } from "@adonisjs/core";
import { and, count, eq, isNull, ne, sql } from "drizzle-orm";

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
  constructor(
    private db: DatabaseService,
    private permissions: GetMediaPermissionsService
  ) {}

  async initiateUpload(
    params: InitiateUploadParams
  ): Promise<InitiateUploadResult> {
    const { userId, uploadLength, uploadMetadata } = params;

    const [dancerProfile, permissions] = await Promise.all([
      this.db.use((db) =>
        db
          .select({ id: dancerProfiles.id })
          .from(dancerProfiles)
          .where(eq(dancerProfiles.userId, userId))
          .limit(1)
          .then((rows) => rows[0])
      ),
      this.permissions.execute(userId),
    ]);

    if (dancerProfile && !permissions.canUploadDirectVideo) {
      return {
        error: "limit_exceeded",
        message:
          "Direct video uploads require a premium subscription. Add a YouTube video instead, or upgrade to premium.",
      };
    }

    const videoLimit = permissions.directVideoLimit;

    return this.db.tx(async (tx) => {
      if (videoLimit !== null) {
        // Hold the user's lock from the count to the insert, so uploads
        // started at the same time cannot all pass the limit.
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${userId}))`
        );

        const [[completedCount], unfinishedUploads] = await Promise.all([
          tx
            .select({ count: count() })
            .from(videos)
            .where(
              and(eq(videos.userId, userId), eq(videos.type, "cloudflare"))
            ),
          tx
            .select({ cloudflareMediaId: videoUploads.cloudflareMediaId })
            .from(videoUploads)
            .where(
              and(
                eq(videoUploads.userId, userId),
                isNull(videoUploads.videoId),
                ne(videoUploads.status, "failed")
              )
            ),
        ]);

        if (
          completedCount.count + unfinishedUploads.length >= videoLimit &&
          completedCount.count +
            (await this.countReceivedUploads(unfinishedUploads)) >=
            videoLimit
        ) {
          return {
            error: "limit_exceeded" as const,
            message: `You can only upload ${videoLimit} videos. Delete an existing video to upload a new one.`,
          };
        }
      }

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.get(
          "CLOUDFLARE_ACCOUNT_ID"
        )}/stream?direct_user=true`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.get("CLOUDFLARE_STREAM_TOKEN")}`,
            "Tus-Resumable": "1.0.0",
            "Upload-Length": uploadLength,
            ...streamUploadHeaders(uploadMetadata, userId),
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
      await tx.insert(videoUploads).values({
        userId,
        cloudflareMediaId: streamMediaId,
        status: "pending",
      });

      return { location, streamMediaId };
    });
  }

  // An unfinished upload only counts toward the limit once Cloudflare has all
  // of its bytes. One that failed or was abandoned mid-transfer stays in
  // `pendingupload` (or `error`) until the reaper cron clears it hours later,
  // and must not block the user's retry in the meantime. Only called when the
  // user is at the limit, so most uploads skip these Cloudflare calls.
  private async countReceivedUploads(uploads: { cloudflareMediaId: string }[]) {
    const received = await Promise.all(
      uploads.map((upload) => this.hasReceivedBytes(upload.cloudflareMediaId))
    );
    return received.filter(Boolean).length;
  }

  private async hasReceivedBytes(mediaId: string) {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.get(
          "CLOUDFLARE_ACCOUNT_ID"
        )}/stream/${mediaId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${env.get("CLOUDFLARE_STREAM_TOKEN")}`,
          },
        }
      );

      if (response.status === 404) {
        return false;
      }

      if (!response.ok) {
        return true;
      }

      const body = (await response.json()) as {
        result?: { status?: { state?: string } };
      };
      const state = body.result?.status?.state;
      return state !== "pendingupload" && state !== "error";
    } catch {
      // Cloudflare unreachable: keep counting it rather than let users exceed
      // the limit.
      return true;
    }
  }
}
