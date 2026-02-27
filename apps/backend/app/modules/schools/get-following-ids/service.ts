import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string) {
    const following = await this.db.use((db) =>
      db.query.favorites.findMany({
        where: {
          schoolId: profileId,
        },
        columns: {
          dancerId: true,
        },
      })
    );

    return following.map((favorite) => favorite.dancerId);
  }
}
