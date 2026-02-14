import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    return await this.db.use((db) =>
      db.query.posts.findMany({
        columns: {
          id: true,
          slug: true,
          title: true,
          description: true,
          thumbnail: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    );
  }
}
