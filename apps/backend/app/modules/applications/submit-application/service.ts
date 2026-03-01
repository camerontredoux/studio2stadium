import { schoolApplications } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type SubmitApplicationSchema } from "./schema.ts";

@inject()
export class SubmitApplicationService {
  constructor(private db: DatabaseService) {}

  async execute(
    schoolId: string,
    userId: string,
    data: SubmitApplicationSchema
  ) {
    await this.db.tx(async (tx) => {
      tx.update(users).set({ phone: data.phone }).where(eq(users.id, userId));
      tx.insert(schoolApplications).values({ mediaId: data.mediaId, schoolId });
    });
  }
}
