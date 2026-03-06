import { DatabaseService } from "#database/service";
import { videoUrl } from "#utils/video-url";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params: { category }, page }: Validator) {
    const limit = 6;
    const offset = (page - 1) * limit;

    const videos = await this.db.use((db) =>
      db.query.library.findMany({
        where: {
          category,
        },
        orderBy: {
          createdAt: "desc",
        },
        limit,
        offset,
      })
    );

    return videos.map((video) => {
      const { url, ...rest } = video;
      const youtubeUrl = videoUrl(url, "youtube");
      return { ...rest, url: youtubeUrl };
    });
  }
}
