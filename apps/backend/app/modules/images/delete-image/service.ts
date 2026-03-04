import { feed } from "#database/schema/feed";
import { images } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import drive from "@adonisjs/drive/services/main";
import { and, eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class DeleteProfileImageService {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator) {
    const disk = drive.use("r2");

    const image = await this.db.use((db) =>
      db.query.images.findFirst({
        where: {
          id: params.id,
        },
        columns: {
          id: true,
          mediaUrl: true,
        },
      })
    );

    if (!image) {
      return { error: "Image not found" };
    }

    const exists = await disk.exists(image.mediaUrl);

    if (exists) {
      try {
        await disk.delete(image.mediaUrl);
      } catch (e) {
        if (e instanceof Error) {
          throw new Error(e.message);
        }
        throw new Error("Failed to delete file");
      }
    }

    await this.db.tx(async (tx) => {
      await tx.delete(images).where(eq(images.id, image.id));
      await tx
        .delete(feed)
        .where(
          and(eq(feed.contentId, image.id), eq(feed.contentType, "image"))
        );
    });
  }
}
