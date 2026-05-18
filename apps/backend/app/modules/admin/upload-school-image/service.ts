import { feed } from "#database/schema/feed";
import { images } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import drive from "@adonisjs/drive/services/main";
import {
  invalidateSchoolProfileCache,
  resolveSchoolUserByUsername,
} from "../resolve-school-user.ts";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params, key }: Validator) {
    const resolved = await resolveSchoolUserByUsername(
      this.db,
      params.username
    );
    if (!resolved.ok) {
      return { error: resolved.error };
    }

    const disk = drive.use("r2");
    const exists = await disk.exists(key);
    if (!exists) {
      return { error: "File not found" };
    }

    await this.db.tx(async (tx) => {
      const [image] = await tx
        .insert(images)
        .values({
          userId: resolved.school.userId,
          mediaUrl: key,
        })
        .returning({ id: images.id });

      await tx.insert(feed).values({
        userId: resolved.school.userId,
        contentId: image.id,
        contentType: "image",
      });
    });

    await invalidateSchoolProfileCache(resolved.school.username);

    return { success: true };
  }
}
