import { DatabaseService } from "#database/service";
import { eventChecklist } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { eq, sql } from "drizzle-orm";
import type { Validator } from "./validator.ts";
import type { AuditContext } from "#database/audit";

@inject()
export class CreateChecklistService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string, input: Validator, auditCtx: AuditContext) {
    return this.db.withAudit(auditCtx, async (tx, audit) => {
      const [row] = await tx
        .select({ maxPos: sql<number>`max(${eventChecklist.position})` })
        .from(eventChecklist)
        .where(eq(eventChecklist.eventId, eventId));
      const maxPos = row?.maxPos ?? -1;
      const [item] = await tx
        .insert(eventChecklist)
        .values({
          eventId,
          title: input.title,
          description: input.description,
          position: maxPos + 1,
        })
        .returning();
      audit.log({
        action: "create",
        resource: "checklist",
        resourceId: item!.id,
        metadata: { after: item },
      });
      return item!;
    });
  }
}
