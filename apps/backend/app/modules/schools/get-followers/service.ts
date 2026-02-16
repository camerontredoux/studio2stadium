import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string) {
    const followers = await this.db.use((db) =>
      db.query.dancerProfiles.findMany({
        where: {
          following: {
            id: profileId,
          },
        },
        columns: {},
        with: {
          user: {
            columns: {
              firstName: true,
              lastName: true,
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
        name: `${f.user!.firstName} ${f.user!.lastName}`,
      }));
  }
}
