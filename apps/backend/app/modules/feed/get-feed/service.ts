import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(userId: string) {
    const feed = await this.db.use((db) =>
      db.query.feed.findMany({
        where: {
          userId,
        },
      })
    );

    return feed;
  }
}
