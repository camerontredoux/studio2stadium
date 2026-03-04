import { db } from "#database/connection";
import { notifications } from "#database/schema/notifications";
import { inject } from "@adonisjs/core";
import { and, count, eq, gte, isNull } from "drizzle-orm";

@inject()
export class Service {
  async execute(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          isNull(notifications.seenAt),
          gte(notifications.createdAt, thirtyDaysAgo)
        )
      );

    return { count: result?.count ?? 0 };
  }
}
