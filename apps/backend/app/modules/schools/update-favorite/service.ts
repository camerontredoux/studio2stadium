import { favorites } from "#database/schema/profiles";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params, ...data }: Validator) {
    await this.db.use((db) =>
      db.update(favorites).set(data).where(eq(favorites.id, params.id))
    );
  }
}
