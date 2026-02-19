import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    const videos = await this.db.use((db) =>
      db.query.library.findMany({
        orderBy: {
          createdAt: "desc",
        },
      })
    );

    const groupedVideos = videos.reduce((acc, video) => {
      const category = video.category;

      if (!acc.get(category)) {
        acc.set(category, []);
      }

      if (acc.get(category)!.length < 6) {
        acc.get(category)?.push(video);
      }

      return acc;
    }, new Map<string, typeof videos>());

    return Array.from(groupedVideos, ([category, categoryVideos]) => ({
      category,
      videos: categoryVideos,
    }));
  }
}
