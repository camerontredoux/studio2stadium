import { library } from "#database/schema/global";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { TrainingVideoDeletedEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(payload: Validator) {
    await this.db.use((db) =>
      db.delete(library).where(eq(library.id, payload.params.id))
    );

    await TrainingVideoDeletedEvent.dispatch({ videoId: payload.params.id });

    return { success: true };
  }
}
