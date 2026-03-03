import { crvSubmissions } from "#database/schema/crv";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import { ProspectStatusEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(
    profileId: string,
    { params, ...data }: Validator,
    isAdmin?: boolean
  ) {
    const updateData: Record<string, unknown> = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.watched !== undefined) {
      updateData.watched = data.watched;
      if (data.watched) {
        updateData.watchedAt = new Date();
      }
    }

    if (Object.keys(updateData).length === 0) {
      return;
    }

    const [updated] = await this.db.use((db) =>
      db
        .update(crvSubmissions)
        .set(updateData)
        .where(
          and(
            eq(crvSubmissions.id, params.id),
            eq(crvSubmissions.schoolId, profileId)
          )
        )
        .returning({ dancerId: crvSubmissions.dancerId })
    );

    // Only dispatch event when status changes (not watched)
    if (data.status !== undefined && updated) {
      ProspectStatusEvent.dispatch({
        dancerId: updated.dancerId,
        schoolId: profileId,
        status: data.status,
        isAdmin,
      });
    }
  }
}
