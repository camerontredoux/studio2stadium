import { images } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import drive from "@adonisjs/drive/services/main";
import { Validator } from "./validator.ts";

@inject()
export class UploadProfileImageService {
  constructor(private db: DatabaseService) {}

  async execute(userId: string, { key }: Validator) {
    const disk = drive.use("r2");

    const exists = await disk.exists(key);

    if (!exists) {
      return { error: "File not found" };
    }

    await this.db.use((db) =>
      db.insert(images).values({
        userId,
        mediaUrl: key,
      })
    );
  }
}
