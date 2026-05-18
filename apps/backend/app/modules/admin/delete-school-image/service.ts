import { feed } from "#database/schema/feed";
import { images } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import drive from "@adonisjs/drive/services/main";
import { and, eq } from "drizzle-orm";
import {
  invalidateSchoolProfileCache,
  resolveSchoolUserByUsername,
} from "../resolve-school-user.ts";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator) {
    const resolved = await resolveSchoolUserByUsername(
      this.db,
      params.username
    );
    if (!resolved.ok) {
      return { error: resolved.error };
    }

    const image = await this.db.use((db) =>
      db.query.images.findFirst({
        where: {
          id: params.id,
          userId: resolved.school.userId,
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

    const disk = drive.use("r2");
    const exists = await disk.exists(image.mediaUrl);
    if (exists) {
      await disk.delete(image.mediaUrl);
    }

    await this.db.tx(async (tx) => {
      await tx.delete(images).where(eq(images.id, image.id));
      await tx
        .delete(feed)
        .where(
          and(eq(feed.contentId, image.id), eq(feed.contentType, "image"))
        );
    });

    await invalidateSchoolProfileCache(resolved.school.username);

    return { success: true };
  }
}
