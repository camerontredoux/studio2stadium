import { platformName } from "#database/schema/enums";
import { favorites } from "#database/schema/profiles";
import { DatabaseService } from "#database/service";
import { E_DATABASE_ERROR } from "#exceptions/database";
import { inject } from "@adonisjs/core";
import { FavoriteEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(
    { params }: Validator,
    profileId: string,
    platform: (typeof platformName.enumValues)[number]
  ) {
    try {
      await this.db.use((db) =>
        db.insert(favorites).values({
          schoolId: profileId,
          dancerId: params.id,
          platformName: platform,
        })
      );
    } catch (error) {
      if (error instanceof E_DATABASE_ERROR) {
        if (error.code === "E_UNIQUE_VIOLATION") {
          return { created: false };
        }
      }
      throw error;
    }

    FavoriteEvent.dispatch({
      schoolId: profileId,
      dancerId: params.id,
      platform,
    });

    return { created: true };
  }
}
