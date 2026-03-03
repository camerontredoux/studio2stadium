import { follows } from "#database/schema/profiles";
import { DatabaseService } from "#database/service";
import { E_DATABASE_ERROR } from "#exceptions/database";
import { inject } from "@adonisjs/core";
import { FollowSchoolEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator, profileId: string) {
    try {
      await this.db.use((db) =>
        db.insert(follows).values({
          dancerId: profileId,
          schoolId: params.id,
        })
      );
    } catch (error) {
      console.log(error);
      if (error instanceof E_DATABASE_ERROR) {
        if (error.code === "E_UNIQUE_VIOLATION") {
          return { created: false };
        }
      }
      throw error;
    }

    FollowSchoolEvent.dispatch({
      dancerId: profileId,
      schoolId: params.id,
    });

    return { created: true };
  }
}
