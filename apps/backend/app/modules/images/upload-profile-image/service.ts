import { feed } from "#database/schema/feed";
import { images } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import { GetMediaPermissionsService } from "#modules/media/permissions/service";
import { inject } from "@adonisjs/core";
import drive from "@adonisjs/drive/services/main";
import { count, eq } from "drizzle-orm";
import { ImageUploadEvent } from "./event.ts";
import { Validator } from "./validator.ts";

interface UserInfo {
  id: string;
  type: "dancer" | "school";
  profileId: string;
}

@inject()
export class UploadProfileImageService {
  constructor(
    private db: DatabaseService,
    private permissions: GetMediaPermissionsService
  ) {}

  async execute(user: UserInfo, { key }: Validator) {
    const [[imageCount], permissions] = await Promise.all([
      this.db.use((db) =>
        db
          .select({ count: count() })
          .from(images)
          .where(eq(images.userId, user.id))
      ),
      this.permissions.execute(user.id),
    ]);

    if (user.type === "dancer" && !permissions.canUploadPhoto) {
      return {
        error: "limit_exceeded",
        message: "Photo uploads are not available for your organization tier.",
      };
    }

    if (
      user.type === "dancer" &&
      permissions.photoLimit !== null &&
      imageCount.count >= permissions.photoLimit
    ) {
      return {
        error: "limit_exceeded",
        message: `Free tier users can only upload ${permissions.photoLimit} images. Upgrade to premium for unlimited uploads.`,
      };
    }

    const disk = drive.use("r2");

    const exists = await disk.exists(key);

    if (!exists) {
      return { error: "not_found", message: "File not found" };
    }

    await this.db.tx(async (tx) => {
      const [image] = await tx
        .insert(images)
        .values({
          userId: user.id,
          mediaUrl: key,
        })
        .returning({ id: images.id });

      await tx.insert(feed).values({
        userId: user.id,
        contentId: image.id,
        contentType: "image",
      });
    });

    ImageUploadEvent.dispatch({
      profileId: user.profileId,
      userType: user.type,
    });
  }
}
