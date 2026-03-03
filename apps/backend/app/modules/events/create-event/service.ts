import { danceEvents } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { SchoolEventCreatedEvent } from "./event.ts";
import { CreateEventSchema } from "./schema.ts";

@inject()
export class CreateEventService {
  constructor(private db: DatabaseService) {}

  async execute(payload: CreateEventSchema, schoolId: string) {
    const [created] = await this.db.use((db) =>
      db
        .insert(danceEvents)
        .values({
          ...payload,
          startDatetime: new Date(payload.startDatetime),
          endDatetime: new Date(payload.endDatetime),
          schoolId,
        })
        .returning({ id: danceEvents.id })
    );

    SchoolEventCreatedEvent.dispatch({
      schoolId,
      eventId: created.id,
    });
  }
}
