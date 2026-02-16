import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string) {
    const followers = await this.db.use((db) =>
      db.query.schoolProfiles.findMany({
        where: {
          favorites: {
            id: profileId,
          },
        },
        columns: {
          name: true,
        },
        with: {
          user: {
            columns: {
              username: true,
              avatar: true,
            },
          },
        },
      })
    );

    return followers
      .filter((f) => f.user)
      .map((f) => ({
        username: f.user!.username,
        avatar: f.user!.avatar,
        name: f.name,
      }));
  }
}
