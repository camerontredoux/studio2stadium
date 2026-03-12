import { danceEvents } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params, ...payload }: Validator) {
    const existing = await this.db.use((db) =>
      db.query.danceEvents.findFirst({
        where: { id: params.id },
        columns: { id: true },
      })
    );

    if (!existing) {
      return { error: "Event not found" };
    }

    const updateData: Record<string, unknown> = {};

    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined)
      updateData.description = payload.description;
    if (payload.location !== undefined) updateData.location = payload.location;
    if (payload.address !== undefined) updateData.address = payload.address;
    if (payload.website !== undefined) updateData.website = payload.website;
    if (payload.tags !== undefined) updateData.tags = payload.tags;
    if (payload.cost !== undefined) updateData.cost = payload.cost;
    if (payload.type !== undefined) updateData.type = payload.type;
    if (payload.startDatetime !== undefined)
      updateData.startDatetime = new Date(payload.startDatetime);
    if (payload.endDatetime !== undefined)
      updateData.endDatetime = new Date(payload.endDatetime);

    if (Object.keys(updateData).length === 0) {
      return { id: params.id };
    }

    await this.db.use((db) =>
      db.update(danceEvents).set(updateData).where(eq(danceEvents.id, params.id))
    );

    return { id: params.id };
  }
}
