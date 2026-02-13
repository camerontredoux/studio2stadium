import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(username: string) {
    return await this.db.use((db) =>
      db.query.users.findFirst({
        where: {
          username,
        },
        columns: {
          id: true,
          username: true,
          avatar: true,
        },
        with: {
          schoolProfile: {
            with: {
              skills: true,
              styles: true,
              events: true,
              sports: true,
              media: true,
              interested: {
                where: {
                  user: {
                    username,
                  },
                },
              },
            },
          },
        },
      })
    );
  }
}
