import { db } from "#database/connection";
import { notifications } from "#database/schema/notifications";
import { inject } from "@adonisjs/core";
import { and, eq, isNull } from "drizzle-orm";

@inject()
export class Service {
  async execute(userId: string) {
    await db
      .update(notifications)
      .set({ seenAt: new Date() })
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.seenAt))
      );

    return { success: true };
  }
}
