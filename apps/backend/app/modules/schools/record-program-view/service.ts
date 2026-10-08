import { programViews } from "#database/schema/profiles";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  // Idempotent: only the first view of each school is kept.
  async execute(dancerId: string, { params }: Validator) {
    await this.db.use((db) =>
      db
        .insert(programViews)
        .values({ dancerId, schoolId: params.id })
        .onConflictDoNothing()
    );
  }
}
