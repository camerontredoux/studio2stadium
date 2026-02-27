import { images } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import drive from "@adonisjs/drive/services/main";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class DeleteProfileImageService {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator) {
    const disk = drive.use("r2");

    const exists = await disk.exists(params.key);

    if (!exists) {
      return { error: "File not found" };
    }

    try {
      await disk.delete(params.key);
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(e.message);
      }
      throw new Error("Failed to delete file");
    }

    await this.db.use((db) =>
      db.delete(images).where(eq(images.mediaUrl, params.key))
    );
  }
}
