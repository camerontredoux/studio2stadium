import { achievements } from "#database/schema/dancers";
import { DatabaseService } from "#database/service";
import { assertFullOrder } from "#shared/ordering/assert-full-order";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, { ids }: Validator) {
    await this.db.tx(async (tx) => {
      const rows = await tx
        .select({ id: achievements.id })
        .from(achievements)
        .where(eq(achievements.profileId, profileId))
        .for("update");

      assertFullOrder(
        rows.map((row) => row.id),
        ids
      );

      for (const [position, id] of ids.entries()) {
        await tx
          .update(achievements)
          .set({ position })
          .where(
            and(eq(achievements.id, id), eq(achievements.profileId, profileId))
          );
      }
    });
  }
}
