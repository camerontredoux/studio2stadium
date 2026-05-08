import { DatabaseService } from "#database/service";
import {
  eventVideoCategories,
  eventVideos,
} from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq, sql } from "drizzle-orm";
import type { AuditContext } from "#database/audit";

@inject()
export class DeleteVideoCategoryService {
  constructor(private db: DatabaseService) {}

  async execute(
    eventId: string,
    categoryId: string,
    auditCtx: AuditContext
  ) {
    return this.db.withAudit(auditCtx, async (tx, audit) => {
      const [count] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(eventVideos)
        .where(eq(eventVideos.categoryId, categoryId));

      if (count && count.count > 0) {
        throw new Error(
          `Cannot delete category — ${count.count} videos still use it`
        );
      }

      const [before] = await tx
        .select()
        .from(eventVideoCategories)
        .where(
          and(
            eq(eventVideoCategories.id, categoryId),
            eq(eventVideoCategories.eventId, eventId)
          )
        );

      await tx
        .delete(eventVideoCategories)
        .where(
          and(
            eq(eventVideoCategories.id, categoryId),
            eq(eventVideoCategories.eventId, eventId)
          )
        )
        .execute();

      audit.log({
        action: "delete",
        resource: "video_category",
        resourceId: categoryId,
        metadata: { before },
      });
    });
  }
}
