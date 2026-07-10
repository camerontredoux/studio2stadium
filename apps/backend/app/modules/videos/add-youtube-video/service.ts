import { dancerProfiles } from "#database/schema/dancers";
import { feed } from "#database/schema/feed";
import { videos } from "#database/schema/media";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import {
  GetMediaPermissionsService,
  ORG_STANDARD_YOUTUBE_LIMIT,
} from "#modules/media/permissions/service";
import { VideoUploadEvent } from "#modules/videos/upload-profile-video/event";
import { inject } from "@adonisjs/core";
import { and, count, eq, sql } from "drizzle-orm";
import { Validator } from "./validator.ts";

type AddYoutubeVideoResult =
  | { video: { id: string; mediaId: string } }
  | { error: "duplicate" | "forbidden" | "limit_exceeded"; message: string };

@inject()
export class AddYoutubeVideoService {
  constructor(
    private db: DatabaseService,
    private permissions: GetMediaPermissionsService
  ) {}

  async execute(
    userId: string,
    input: Validator
  ): Promise<AddYoutubeVideoResult> {
    const [existingVideo, dancerProfile, user, permissions] = await Promise.all(
      [
        this.db.use((db) =>
          db
            .select({ id: videos.id })
            .from(videos)
            .where(eq(videos.mediaId, input.videoId))
            .limit(1)
            .then((rows) => rows[0])
        ),
        this.db.use((db) =>
          db
            .select({ id: dancerProfiles.id })
            .from(dancerProfiles)
            .where(eq(dancerProfiles.userId, userId))
            .limit(1)
            .then((rows) => rows[0])
        ),
        this.db.use((db) =>
          db
            .select({ type: users.type })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .then((rows) => rows[0])
        ),
        this.permissions.execute(userId),
      ]
    );

    if (!permissions.canAddYoutubeVideo) {
      return {
        error: "forbidden",
        message: "YouTube videos are not available for your account tier.",
      };
    }

    if (existingVideo) {
      return {
        error: "duplicate",
        message: "This YouTube video has already been added.",
      };
    }

    const video = await this.db.tx(async (tx) => {
      if (permissions.youtubeLimit !== null) {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${userId}))`
        );

        const [youtubeCount] = await tx
          .select({ count: count() })
          .from(videos)
          .where(and(eq(videos.userId, userId), eq(videos.type, "youtube")));

        if (youtubeCount.count >= permissions.youtubeLimit) {
          return null;
        }
      }

      const [newVideo] = await tx
        .insert(videos)
        .values({
          userId,
          mediaId: input.videoId,
          caption: input.caption,
          type: "youtube",
        })
        .returning({ id: videos.id, mediaId: videos.mediaId });

      await tx.insert(feed).values({
        userId,
        contentId: newVideo.id,
        contentType: "video",
      });

      return newVideo;
    });

    if (!video) {
      return {
        error: "limit_exceeded",
        message: `Your organization tier allows up to ${ORG_STANDARD_YOUTUBE_LIMIT} YouTube videos. Delete one to add another.`,
      };
    }

    // Dispatch event to bust cache and publish to outbox
    if (user) {
      let profileId: string | null = null;

      if (user.type === "dancer" && dancerProfile) {
        profileId = dancerProfile.id;
      } else if (user.type === "school") {
        const [school] = await this.db.use((db) =>
          db
            .select({ id: schoolProfiles.id })
            .from(schoolProfiles)
            .where(eq(schoolProfiles.userId, userId))
            .limit(1)
        );
        profileId = school?.id ?? null;
      }

      if (profileId) {
        VideoUploadEvent.dispatch({
          profileId,
          userType: user.type,
        });
      }
    }

    return { video };
  }
}
