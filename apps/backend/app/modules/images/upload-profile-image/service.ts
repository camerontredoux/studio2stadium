import { feed } from "#database/schema/feed";
import { images } from "#database/schema/media";
import { subscriptions } from "#database/schema/subscriptions";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import drive from "@adonisjs/drive/services/main";
import { and, count, eq } from "drizzle-orm";
import { ImageUploadEvent } from "./event.ts";
import { Validator } from "./validator.ts";

const FREE_TIER_IMAGE_LIMIT = 4;

interface UserInfo {
  id: string;
  type: "dancer" | "school" | "studio";
  profileId: string;
}

@inject()
export class UploadProfileImageService {
  constructor(private db: DatabaseService) {}

  async execute(user: UserInfo, { key }: Validator) {
    const [[imageCount], subscription] = await Promise.all([
      this.db.use((db) =>
        db
          .select({ count: count() })
          .from(images)
          .where(eq(images.userId, user.id))
      ),
      this.db.use((db) =>
        db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.userId, user.id),
              eq(subscriptions.status, "active")
            )
          )
          .limit(1)
          .then((rows) => rows[0])
      ),
    ]);

    // Only dancers have the free tier image limit
    if (
      user.type === "dancer" &&
      !subscription &&
      imageCount.count >= FREE_TIER_IMAGE_LIMIT
    ) {
      return {
        error: "limit_exceeded",
        message:
          "Free tier users can only upload 4 images. Upgrade to premium for unlimited uploads.",
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
