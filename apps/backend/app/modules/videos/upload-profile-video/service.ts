import { videos } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { VideoUploadEvent } from "./event.ts";
import { Validator } from "./validator.ts";

interface UserInfo {
  id: string;
  type: "dancer" | "school";
  profileId: string;
}

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(user: UserInfo, data: Validator) {
    await this.db.use((db) =>
      db.insert(videos).values({
        userId: user.id,
        mediaId: data.mediaId,
        caption: data.caption,
      })
    );

    VideoUploadEvent.dispatch({
      profileId: user.profileId,
      userType: user.type,
    });
  }
}
