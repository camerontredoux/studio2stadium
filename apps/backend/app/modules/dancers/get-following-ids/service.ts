import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string) {
    const following = await this.db.use((db) =>
      db.query.follows.findMany({
        where: {
          dancerId: profileId,
        },
        columns: {
          schoolId: true,
        },
      })
    );

    return following.map((follow) => follow.schoolId);
  }
}
