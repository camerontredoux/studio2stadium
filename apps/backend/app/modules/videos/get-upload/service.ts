import { videoUploads } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";

@inject()
export class GetVideoUploadService {
  constructor(private db: DatabaseService) {}

  // An admin can read any upload, because admins upload school videos for
  // the school's account.
  async execute(mediaId: string, viewer: { id: string; role: string }) {
    const [upload] = await this.db.use((db) =>
      db
        .select({
          mediaId: videoUploads.cloudflareMediaId,
          status: videoUploads.status,
          errorMessage: videoUploads.errorMessage,
        })
        .from(videoUploads)
        .where(
          and(
            eq(videoUploads.cloudflareMediaId, mediaId),
            viewer.role === "admin"
              ? undefined
              : eq(videoUploads.userId, viewer.id)
          )
        )
        .limit(1)
    );

    return upload ?? null;
  }
}
