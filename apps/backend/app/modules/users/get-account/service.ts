import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(userId: string) {
    return await this.db.use((db) =>
      db.query.users.findFirst({
        where: {
          id: userId,
        },
        columns: {
          username: true,
          firstName: true,
          lastName: true,
          displayEmail: true,
          phone: true,
          notifications: true,
        },
      })
    );
  }
}
