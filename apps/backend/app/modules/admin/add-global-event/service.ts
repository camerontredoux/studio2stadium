import { globalDanceEvents } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(payload: Validator) {
    const [created] = await this.db.use((db) =>
      db
        .insert(globalDanceEvents)
        .values({
          ...payload,
          startDatetime: new Date(payload.startDatetime),
          endDatetime: new Date(payload.endDatetime),
        })
        .returning({ id: globalDanceEvents.id })
    );

    return { id: created.id };
  }
}
