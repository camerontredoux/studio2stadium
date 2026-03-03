import { achievements } from "#database/schema/dancers";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { DancerAchievementEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, data: Validator) {
    await this.db.use((db) =>
      db.insert(achievements).values({
        profileId,
        description: data.description,
        title: data.title,
      })
    );

    DancerAchievementEvent.dispatch({ dancerId: profileId });
  }
}
