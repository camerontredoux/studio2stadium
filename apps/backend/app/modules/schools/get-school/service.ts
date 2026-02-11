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
          platforms: {
            platformName: "core",
          },
        },
        columns: {
          id: true,
          username: true,
          avatar: true,
        },
        with: {
          schoolProfile: {
            columns: {
              location: true,
              gpa: true,
            },
            with: {
              skills: true,
              styles: true,
            },
          },
        },
      })
    );
  }
}
