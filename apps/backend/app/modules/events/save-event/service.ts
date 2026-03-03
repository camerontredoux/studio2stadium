import {
  danceEventAttendees,
  globalDanceEventAttendees,
} from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { EventAttendedEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params, type }: Validator, userId: string) {
    const table =
      type === "global" ? globalDanceEventAttendees : danceEventAttendees;

    await this.db.use((db) =>
      db.insert(table).values({
        eventId: params.id,
        userId,
      })
    );

    EventAttendedEvent.dispatch({
      userId,
      eventId: params.id,
    });
  }
}
