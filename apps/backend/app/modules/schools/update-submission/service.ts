import { crvSubmissions } from "#database/schema/crv";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, { params, ...data }: Validator) {
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

    await this.db.use((db) =>
      db
        .update(crvSubmissions)
        .set(updateData)
        .where(
          and(
            eq(crvSubmissions.id, params.id),
            eq(crvSubmissions.schoolId, profileId)
          )
        )
    );
  }
}
