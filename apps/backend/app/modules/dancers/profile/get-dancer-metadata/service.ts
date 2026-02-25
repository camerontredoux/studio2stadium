import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator, profileId: string) {
    const metadata = await this.db.use((db) =>
      db.query.dancerProfiles.findFirst({
        where: {
          id: params.id,
        },
        with: {
          followers: true,
        },
      })
    );

    const followers = metadata?.followers.length;
    const favorited = metadata?.followers.some(
      (follower) => follower.id === profileId
    );

    return { followers, favorited };
  }
}
