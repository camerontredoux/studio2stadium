import { achievements } from "#database/schema/dancers";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class UpdateAchievementService {
  constructor(private db: DatabaseService) {}

  async execute({ params, ...data }: Validator) {
    await this.db.use((db) =>
      db.update(achievements).set(data).where(eq(achievements.id, params.id))
    );
  }
}
