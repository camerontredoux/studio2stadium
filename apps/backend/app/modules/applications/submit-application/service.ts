import { schoolApplications } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { ApplicationSubmittedEvent } from "./event.ts";
import { type SubmitApplicationSchema } from "./schema.ts";

@inject()
export class SubmitApplicationService {
  constructor(private db: DatabaseService) {}

  async execute(
    schoolId: string,
    userId: string,
    data: SubmitApplicationSchema
  ) {
    // schoolId is unique, so a repeat submit throws here and sends no email
    const application = await this.db.tx(async (tx) => {
      await tx
        .update(users)
        .set({ phone: data.phone })
        .where(eq(users.id, userId));
      const [row] = await tx
        .insert(schoolApplications)
        .values({ mediaId: data.mediaId, schoolId })
        .returning();
      return row!;
    });

    // Dispatched after the commit: a failed email cannot undo the submission
    ApplicationSubmittedEvent.dispatch({
      schoolId,
      userId,
      submittedAt: application.createdAt,
    });
  }
}
