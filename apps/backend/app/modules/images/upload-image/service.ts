import { images } from "#database/schema/media";
import { subscriptions } from "#database/schema/subscriptions";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import drive from "@adonisjs/drive/services/main";
import { and, count, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { type Validator } from "./validator.ts";

const FREE_TIER_IMAGE_LIMIT = 4;

@inject()
export class UploadImageService {
  constructor(private db: DatabaseService) {}

  async execute(userId: string, { contentType, type }: Validator) {
    if (type === "feed") {
      const [[imageCount], subscription] = await Promise.all([
        this.db.use((db) =>
          db
            .select({ count: count() })
            .from(images)
            .where(eq(images.userId, userId))
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

      if (!subscription && imageCount.count >= FREE_TIER_IMAGE_LIMIT) {
        return {
          error: "limit_exceeded",
          message:
            "Free tier users can only upload 4 images. Upgrade to premium for unlimited uploads.",
        };
      }
    }

    const disk = drive.use("r2");

    const key = `${type}/${userId}/${randomUUID()}`;

    const signedUrl = await disk.getSignedUploadUrl(key, {
      expiresIn: "15 mins",
      contentType,
    });

    return { key, url: signedUrl };
  }
}
