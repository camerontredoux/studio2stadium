import { danceEvents } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { EditEventSchema } from "./schema.ts";

@inject()
export class EditEventService {
  constructor(private db: DatabaseService) {}

  async execute(payload: EditEventSchema) {
    await this.db.use((db) =>
      db
        .update(danceEvents)
        .set({
          ...payload,
          startDatetime: payload.startDatetime
            ? new Date(payload.startDatetime)
            : undefined,
          endDatetime: payload.endDatetime
            ? new Date(payload.endDatetime)
            : undefined,
        })
        .where(eq(danceEvents.id, payload.params.id))
    );
  }
}
