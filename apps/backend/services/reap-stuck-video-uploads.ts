import { db } from "#database/connection";
import { videoUploads } from "#database/schema/media";
import {
  handleStreamWebhook,
  type StreamWebhookPayload,
} from "#modules/webhooks/cloudflare/handlers";
import env from "#start/env";
import { and, eq, inArray, isNull, lt } from "drizzle-orm";

// A direct (TUS) upload that never finishes leaves a `pending` row and a
// Cloudflare Stream entry stuck in `pendingupload`. Cloudflare never fires a
// webhook for those, so the row lives forever and keeps consuming the user's
// direct-video limit. Uploads of a <=120s clip complete in minutes, so any row
// still unresolved after this window is treated as reconcilable.
const STUCK_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

interface CloudflareStreamResult {
  uid: string;
  readyToStream: boolean;
  status: {
    state: string;
    errorReasonCode?: string;
    errorReasonText?: string;
  };
  thumbnail?: string;
  duration?: number;
}

type StuckUpload = typeof videoUploads.$inferSelect;

export default class ReapStuckVideoUploadsService {
  async run() {
    const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MS);

    const stuck = await db
      .select()
      .from(videoUploads)
      .where(
        and(
          isNull(videoUploads.videoId),
          inArray(videoUploads.status, ["pending", "processing"]),
          lt(videoUploads.createdAt, cutoff)
        )
      );

    if (stuck.length === 0) {
      return;
    }

    console.log(
      `[ReapStuckVideoUploads]: Reconciling ${stuck.length} stuck upload(s)`
    );

    for (const upload of stuck) {
      try {
        await this.reconcile(upload);
      } catch (error) {
        // Transient failures (e.g. Cloudflare API hiccup) are left for the
        // next hourly run rather than blocking the rest of the batch.
        console.error(
          `[ReapStuckVideoUploads]: Failed to reconcile ${upload.cloudflareMediaId}:`,
          error
        );
      }
    }
  }

  private async reconcile(upload: StuckUpload) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.get(
        "CLOUDFLARE_ACCOUNT_ID"
      )}/stream/${upload.cloudflareMediaId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.get("CLOUDFLARE_STREAM_TOKEN")}`,
        },
      }
    );

    // The Cloudflare entry is already gone — nothing to delete, just fail the row.
    if (response.status === 404) {
      await this.markFailed(upload, "stale/abandoned upload");
      return;
    }

    if (!response.ok) {
      throw new Error(`Cloudflare Stream API error: ${response.status}`);
    }

    const body = (await response.json()) as {
      result?: CloudflareStreamResult;
    };
    const result = body.result;
    if (!result) {
      throw new Error("Missing result in Cloudflare response");
    }

    switch (result.status.state) {
      case "ready": {
        // The upload actually completed but we missed the webhook. Replay it
        // through the real handler so the video, feed entry, and ready event
        // are all created exactly as they would have been.
        await handleStreamWebhook(this.toWebhookPayload(result));
        break;
      }

      case "error": {
        const message =
          result.status.errorReasonText ||
          result.status.errorReasonCode ||
          "Cloudflare processing error";
        await this.markFailed(upload, message);
        await this.deleteFromCloudflare(upload.cloudflareMediaId);
        break;
      }

      case "pendingupload": {
        // Bytes were never fully uploaded — genuinely abandoned.
        await this.markFailed(upload, "stale/abandoned upload");
        await this.deleteFromCloudflare(upload.cloudflareMediaId);
        break;
      }

      // inprogress / queued / downloading: Cloudflare is still actively working
      // on it. Leave it alone (it stays counted) and let the webhook or a later
      // run resolve it, rather than failing legitimate in-flight processing.
      default:
        break;
    }
  }

  private toWebhookPayload(
    result: CloudflareStreamResult
  ): StreamWebhookPayload {
    return {
      uid: result.uid,
      readyToStream: result.readyToStream,
      status: {
        state: "ready",
        errorReasonCode: result.status.errorReasonCode,
        errorReasonText: result.status.errorReasonText,
      },
      thumbnail: result.thumbnail,
      duration: result.duration,
    };
  }

  private async markFailed(upload: StuckUpload, errorMessage: string) {
    await db
      .update(videoUploads)
      .set({
        status: "failed",
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(videoUploads.id, upload.id));
  }

  private async deleteFromCloudflare(mediaId: string) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.get(
        "CLOUDFLARE_ACCOUNT_ID"
      )}/stream/${mediaId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${env.get("CLOUDFLARE_STREAM_TOKEN")}`,
        },
      }
    );

    // 404 is fine — the entry is already gone.
    if (!response.ok && response.status !== 404) {
      console.error(
        `[ReapStuckVideoUploads]: Failed to delete ${mediaId} from Cloudflare: ${response.status}`
      );
    }
  }
}
