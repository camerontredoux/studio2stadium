import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string) {
    return await this.db.use((db) =>
      db.query.dancerSports.findMany({
        where: { dancerId: profileId },
        columns: { sportId: true },
      })
    );
  }
}
