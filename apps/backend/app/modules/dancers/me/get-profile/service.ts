import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(userId: string) {
    const user = await this.db.use((db) =>
      db.query.users.findFirst({
        where: {
          id: userId,
        },
        columns: {
          firstName: true,
          lastName: true,
          displayEmail: true,
          phone: true,
          avatar: true,
        },
        with: {
          dancerProfile: {
            columns: {
              birthday: true,
              location: true,
            },
          },
        },
      })
    );

    if (!user) return null;

    const { dancerProfile, ...rest } = user;

    if (!dancerProfile) return null;

    return {
      ...rest,
      birthday: dancerProfile.birthday,
      location: dancerProfile.location,
    };
  }
}
