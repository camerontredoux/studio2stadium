import { db } from "#database/connection";
import { notifications } from "#database/schema/notifications";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";

@inject()
export class Service {
  async execute(userId: string, notificationId: string) {
    const [updated] = await db
      .update(notifications)
      .set({ seenAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning({ id: notifications.id });

    return updated ?? null;
  }
}
