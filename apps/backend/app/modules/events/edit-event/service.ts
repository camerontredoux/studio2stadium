import { danceEvents } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { EditEventSchema } from "./schema.ts";

@inject()
export class EditEventService {
  constructor(private db: DatabaseService) {}

  async execute(payload: EditEventSchema) {
    const { params, ...data } = payload;

    await this.db.use((db) =>
      db
        .update(danceEvents)
        .set({
          ...data,
          startDatetime: data.startDatetime
            ? new Date(data.startDatetime)
            : undefined,
          endDatetime: data.endDatetime
            ? new Date(data.endDatetime)
            : undefined,
        })
        .where(eq(danceEvents.id, params.id))
    );
  }
}
