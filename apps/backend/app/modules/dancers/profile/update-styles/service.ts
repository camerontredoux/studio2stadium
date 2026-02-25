import { dancerStyles } from "#database/schema/styles";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, data: Validator) {
    await this.db.tx(async (tx) => {
      await tx.delete(dancerStyles).where(eq(dancerStyles.dancerId, profileId));

      if (data.styles.length > 0) {
        await tx.insert(dancerStyles).values(
          data.styles.map((style) => ({
            dancerId: profileId,
            styleId: style,
          }))
        );
      }
    });
  }
}
