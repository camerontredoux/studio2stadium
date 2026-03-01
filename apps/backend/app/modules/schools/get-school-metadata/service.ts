import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator, profileId: string) {
    const metadata = await this.db.use((db) =>
      db.query.schoolProfiles.findFirst({
        where: {
          id: params.id,
        },
        with: {
          followers: true,
          interested: {
            where: {
              id: profileId,
            },
          },
        },
      })
    );

    const interested = await this.db.use((db) =>
      db.query.interests.findFirst({
        where: {
          dancerId: profileId,
          schoolId: params.id,
        },
        columns: {
          count: true,
        },
      })
    );

    const followers = metadata?.followers.length;
    const following = metadata?.followers.some(
      (follower) => follower.id === profileId
    );

    return { followers, following, interested: interested?.count };
  }
}
