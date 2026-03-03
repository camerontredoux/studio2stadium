import { feed } from "#database/schema/feed";
import { images } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import drive from "@adonisjs/drive/services/main";
import { ImageUploadEvent } from "./event.ts";
import { Validator } from "./validator.ts";

interface UserInfo {
  id: string;
  type: "dancer" | "school";
  profileId: string;
}

@inject()
export class UploadProfileImageService {
  constructor(private db: DatabaseService) {}

  async execute(user: UserInfo, { key }: Validator) {
    const disk = drive.use("r2");

    const exists = await disk.exists(key);

    if (!exists) {
      return { error: "File not found" };
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
