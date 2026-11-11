import { images, videos } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import { assertFullOrder } from "#shared/ordering/assert-full-order";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import { type Validator } from "./validator.ts";

const key = (type: string, id: string) => `${type}:${id}`;

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  // Images and videos live in separate tables but share one gallery, so a
  // single position sequence runs across both.
  async execute(userId: string, { items }: Validator) {
    await this.db.tx(async (tx) => {
      const ownedImages = await tx
        .select({ id: images.id })
        .from(images)
        .where(eq(images.userId, userId))
        .for("update");
      const ownedVideos = await tx
        .select({ id: videos.id })
        .from(videos)
        .where(eq(videos.userId, userId))
        .for("update");

      assertFullOrder(
        [
          ...ownedImages.map((row) => key("image", row.id)),
          ...ownedVideos.map((row) => key("video", row.id)),
        ],
        items.map((item) => key(item.type, item.id))
      );

      for (const [position, item] of items.entries()) {
        const table = item.type === "image" ? images : videos;
        await tx
          .update(table)
          .set({ position })
          .where(and(eq(table.id, item.id), eq(table.userId, userId)));
      }
    });
  }
}
