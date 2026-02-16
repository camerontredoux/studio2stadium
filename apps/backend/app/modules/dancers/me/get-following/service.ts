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
        with: {
          school: {
            columns: {
              id: true,
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
          },
        },
      })
    );

    return following
      .filter((f) => f.school?.user)
      .map((f) => ({
        id: f.school!.id,
        username: f.school!.user!.username,
        avatar: f.school!.user!.avatar,
        name: f.school!.name,
      }));
  }
}
