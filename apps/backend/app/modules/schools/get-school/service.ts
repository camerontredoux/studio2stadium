import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(username: string) {
    const school = await this.getSchool(username);

    if (!school) return null;

    const { schoolProfile, ...user } = school;

    if (!schoolProfile) return null;

    return {
      ...user,
      ...schoolProfile,
    };
  }

  async getSchool(username: string) {
    return await this.db.use((db) =>
      db.query.users.findFirst({
        where: {
          username,
        },
        columns: {
          username: true,
          avatar: true,
        },
        with: {
          images: true,
          videos: true,
          schoolProfile: {
            with: {
              skills: true,
              styles: true,
              events: true,
              sports: true,
            },
          },
        },
      })
    );
  }
}
