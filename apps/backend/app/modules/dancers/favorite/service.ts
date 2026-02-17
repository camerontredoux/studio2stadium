import { favorites } from "#database/schema/profiles";
import { DatabaseService } from "#database/service";
import { E_DATABASE_ERROR } from "#exceptions/database";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params, platformName }: Validator, profileId: string) {
    try {
      await this.db.use((db) =>
        db.insert(favorites).values({
          schoolId: profileId,
          dancerId: params.id,
          platformName: platformName ?? "core",
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

    return { created: true };
  }
}
