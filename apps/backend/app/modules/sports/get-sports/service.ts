import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    return await this.db.use((db) =>
      db.query.sports.findMany({
        columns: { slug: true, name: true },
      })
    );
  }
}
