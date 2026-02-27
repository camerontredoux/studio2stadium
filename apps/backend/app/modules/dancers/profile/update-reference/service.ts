import { references } from "#database/schema/dancers";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class UpdateReferenceService {
  constructor(private db: DatabaseService) {}

  async execute({ params, ...data }: Validator) {
    await this.db.use((db) =>
      db.update(references).set(data).where(eq(references.id, params.id))
    );
  }
}
