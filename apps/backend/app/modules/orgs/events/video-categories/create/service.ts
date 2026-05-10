import { DatabaseService } from "#database/service";
import { eventVideoCategories } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { eq, sql } from "drizzle-orm";
import type { Validator } from "./validator.ts";
import type { AuditContext } from "#database/audit";

@inject()
export class CreateVideoCategoryService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string, input: Validator, auditCtx: AuditContext) {
    return this.db.withAudit(auditCtx, async (tx, audit) => {
      const [row] = await tx
        .select({
          maxOrder: sql<number>`coalesce(max(${eventVideoCategories.sortOrder}), -1)`,
        })
        .from(eventVideoCategories)
        .where(eq(eventVideoCategories.eventId, eventId));

      const [item] = await tx
        .insert(eventVideoCategories)
        .values({
          eventId,
          name: input.name,
          sortOrder: (row?.maxOrder ?? -1) + 1,
        })
        .returning();

      audit.log({
        action: "create",
        resource: "video_category",
        resourceId: item!.id,
        metadata: { after: item },
      });

      return item!;
    });
  }
}
