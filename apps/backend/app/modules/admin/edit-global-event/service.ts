import { globalDanceEvents } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params, ...payload }: Validator) {
    const existing = await this.db.use((db) =>
      db.query.globalDanceEvents.findFirst({
        where: { id: params.id },
        columns: { id: true },
      })
    );

    if (!existing) {
      return { error: "Event not found" };
    }

    const updateData: Record<string, unknown> = {};

    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.thumbnail !== undefined)
      updateData.thumbnail = payload.thumbnail;
    if (payload.description !== undefined)
      updateData.description = payload.description;
    if (payload.location !== undefined) updateData.location = payload.location;
    if (payload.website !== undefined) updateData.website = payload.website;
    if (payload.organization !== undefined)
      updateData.organization = payload.organization;
    if (payload.type !== undefined) updateData.type = payload.type;
    if (payload.startDatetime !== undefined)
      updateData.startDatetime = new Date(payload.startDatetime);
    if (payload.endDatetime !== undefined)
      updateData.endDatetime = new Date(payload.endDatetime);

    if (Object.keys(updateData).length === 0) {
      return { id: params.id };
    }

    await this.db.use((db) =>
      db
        .update(globalDanceEvents)
        .set(updateData)
        .where(eq(globalDanceEvents.id, params.id))
    );

    return { id: params.id };
  }
}
