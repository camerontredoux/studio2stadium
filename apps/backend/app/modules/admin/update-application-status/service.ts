import { schoolApplications } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { SchoolApprovedEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params, status, notes }: Validator) {
    // Find the school application
    const application = await this.db.use((db) =>
      db.query.schoolApplications.findFirst({
        where: { id: params.id },
      })
    );

    if (!application) {
      return { error: "Application not found" };
    }

    // Fetch the school profile
    const school = await this.db.use((db) =>
      db.query.schoolProfiles.findFirst({
        where: { id: application.schoolId },
      })
    );

    if (!school) {
      return { error: "School not found" };
    }

    // Update user.verified and application.status
    await this.db.tx(async (tx) => {
      await tx
        .update(users)
        .set({ verified: status === "accepted" })
        .where(eq(users.id, school.userId));

      await tx
        .update(schoolApplications)
        .set({ status, notes })
        .where(eq(schoolApplications.id, params.id));
    });

    if (status === "accepted") {
      SchoolApprovedEvent.dispatch({
        userId: school.userId,
        schoolId: school.id,
        schoolName: school.name,
      });
    }

    return { success: true };
  }
}
