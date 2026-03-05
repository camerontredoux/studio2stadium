import { db } from "#database/connection";
import { dancerProfiles } from "#database/schema/dancers";
import { feed } from "#database/schema/feed";
import { videoUploads, videos } from "#database/schema/media";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { VideoUploadEvent } from "#modules/videos/upload-profile-video/event";
import { eq } from "drizzle-orm";
import { VideoFailedEvent, VideoReadyEvent } from "./event.ts";

export interface StreamWebhookPayload {
  uid: string;
  readyToStream: boolean;
  status: {
    state: "ready" | "error" | "inprogress" | "queued" | "downloading";
    errorReasonCode?: string;
    errorReasonText?: string;
  };
  thumbnail?: string;
  duration?: number;
  meta?: Record<string, string>;
}

export async function handleStreamWebhook(payload: StreamWebhookPayload) {
  const { uid: cloudflareMediaId, status, thumbnail, duration } = payload;

  // Find the upload record
  const [upload] = await db
    .select()
    .from(videoUploads)
    .where(eq(videoUploads.cloudflareMediaId, cloudflareMediaId))
    .limit(1);

  if (!upload) {
    console.warn(
      `No upload record found for cloudflareMediaId: ${cloudflareMediaId}`
    );
    return;
  }

  switch (status.state) {
    case "ready": {
      // Create video record
      const [video] = await db
        .insert(videos)
        .values({
          userId: upload.userId,
          mediaId: cloudflareMediaId,
          type: "cloudflare",
        })
        .returning();

      // Add to feed
      await db.insert(feed).values({
        userId: upload.userId,
        contentId: video.id,
        contentType: "video",
      });

      // Update upload record
      await db
        .update(videoUploads)
        .set({
          status: "ready",
          videoId: video.id,
          thumbnailUrl: thumbnail,
          duration,
          updatedAt: new Date(),
        })
        .where(eq(videoUploads.id, upload.id));

      // Get user type and profile ID for outbox event
      const [user] = await db
        .select({ type: users.type })
        .from(users)
        .where(eq(users.id, upload.userId))
        .limit(1);

      if (user) {
        let profileId: string | null = null;

        if (user.type === "dancer") {
          const [dancer] = await db
            .select({ id: dancerProfiles.id })
            .from(dancerProfiles)
            .where(eq(dancerProfiles.userId, upload.userId))
            .limit(1);
          profileId = dancer?.id ?? null;
        } else if (user.type === "school") {
          const [school] = await db
            .select({ id: schoolProfiles.id })
            .from(schoolProfiles)
            .where(eq(schoolProfiles.userId, upload.userId))
            .limit(1);
          profileId = school?.id ?? null;
        }

        if (profileId) {
          VideoUploadEvent.dispatch({
            profileId,
            userType: user.type,
          });
        }
      }

      VideoReadyEvent.dispatch({
        userId: upload.userId,
        videoId: video.id,
        cloudflareMediaId,
      });
      break;
    }

    case "error": {
      const errorMessage =
        status.errorReasonText || status.errorReasonCode || "Unknown error";

      await db
        .update(videoUploads)
        .set({
          status: "failed",
          errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(videoUploads.id, upload.id));

      VideoFailedEvent.dispatch({
        userId: upload.userId,
        cloudflareMediaId,
        errorMessage,
      });
      break;
    }

    case "inprogress":
    case "queued":
    case "downloading": {
      await db
        .update(videoUploads)
        .set({
          status: "processing",
          updatedAt: new Date(),
        })
        .where(eq(videoUploads.id, upload.id));
      break;
    }
  }
}
