import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(dancerId: string) {
    const submission = await this.db.use((db) =>
      db.query.crvVideos.findFirst({
        where: { dancerId },
        columns: {
          youtubeId: true,
        },
      })
    );

    if (!submission) return null;

    return submission;
  }
}
