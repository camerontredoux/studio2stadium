import { danceEventAttendees } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator, userId: string) {
    await this.db.use((db) =>
      db.insert(danceEventAttendees).values({
        eventId: params.id,
        userId,
      })
    );
  }
}
