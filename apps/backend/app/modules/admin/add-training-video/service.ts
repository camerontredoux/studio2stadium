import { library } from "#database/schema/global";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { TrainingVideoAddedEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(payload: Validator) {
    const [created] = await this.db.use((db) =>
      db
        .insert(library)
        .values({
          title: payload.title,
          url: payload.url,
          category: payload.category,
        })
        .returning({ id: library.id })
    );

    await TrainingVideoAddedEvent.dispatch({ videoId: created.id });

    return { id: created.id };
  }
}
