import { DatabaseService } from "#database/service";
import { eventVideos } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { eq, sql } from "drizzle-orm";
import type { Validator } from "./validator.ts";
import type { AuditContext } from "#database/audit";

@inject()
export class CreateVideoService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string, input: Validator, auditCtx: AuditContext) {
    return this.db.withAudit(auditCtx, async (tx, audit) => {
      const [row] = await tx
        .select({
          maxOrder: sql<number>`coalesce(max(${eventVideos.sortOrder}), -1)`,
        })
        .from(eventVideos)
        .where(eq(eventVideos.categoryId, input.categoryId));

      const [item] = await tx
        .insert(eventVideos)
        .values({
          eventId,
          categoryId: input.categoryId,
          title: input.title,
          youtubeId: input.youtubeId,
          sortOrder: (row?.maxOrder ?? -1) + 1,
        })
        .returning();

      audit.log({
        action: "create",
        resource: "video",
        resourceId: item!.id,
        metadata: { after: item },
      });

      return item!;
    });
  }
}
