import { schoolStyles } from "#database/schema/styles";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, data: Validator) {
    await this.db.tx(async (tx) => {
      await tx.delete(schoolStyles).where(eq(schoolStyles.schoolId, profileId));

      if (data.styles.length > 0) {
        await tx.insert(schoolStyles).values(
          data.styles.map((style) => ({
            schoolId: profileId,
            styleId: style,
          }))
        );
      }
    });
  }
}
