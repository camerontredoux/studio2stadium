import { dancerProfiles } from "#database/schema/dancers";
import { images } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import { GetMediaPermissionsService } from "#modules/media/permissions/service";
import { inject } from "@adonisjs/core";
import drive from "@adonisjs/drive/services/main";
import { count, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { type Validator } from "./validator.ts";

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

function extFromMime(mime: string): string {
  return MIME_TO_EXT[mime] ?? "";
}

@inject()
export class UploadImageService {
  constructor(
    private db: DatabaseService,
    private permissions: GetMediaPermissionsService
  ) {}

  async execute(userId: string, { contentType, type }: Validator) {
    if (type === "feed") {
      const [[imageCount], dancerProfile, permissions] = await Promise.all([
        this.db.use((db) =>
          db
            .select({ count: count() })
            .from(images)
            .where(eq(images.userId, userId))
        ),
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

      if (dancerProfile && !permissions.canUploadPhoto) {
        return {
          error: "limit_exceeded",
          message:
            "Photo uploads are not available for your organization tier.",
        };
      }

      if (
        dancerProfile &&
        permissions.photoLimit !== null &&
        imageCount.count >= permissions.photoLimit
      ) {
        return {
          error: "limit_exceeded",
          message: `Free tier users can only upload ${permissions.photoLimit} images. Upgrade to premium for unlimited uploads.`,
        };
      }
    }

    const disk = drive.use("r2");

    const ext = type === "schedule" ? extFromMime(contentType) : "";
    const key =
      type === "blog"
        ? `blog/${randomUUID()}`
        : `${type}/${userId}/${randomUUID()}${ext}`;

    const signedUrl = await disk.getSignedUploadUrl(key, {
      expiresIn: "15 mins",
      contentType,
    });

    return { key, url: signedUrl };
  }
}
