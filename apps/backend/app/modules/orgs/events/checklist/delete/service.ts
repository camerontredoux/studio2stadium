import { DatabaseService } from "#database/service";
import { eventChecklist } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import type { AuditContext } from "#database/audit";

@inject()
export class DeleteChecklistService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string, itemId: string, auditCtx: AuditContext) {
    return this.db.withAudit(auditCtx, async (tx, audit) => {
      const [before] = await tx
        .select()
        .from(eventChecklist)
        .where(and(eq(eventChecklist.id, itemId), eq(eventChecklist.eventId, eventId)));

      await tx
        .delete(eventChecklist)
        .where(and(eq(eventChecklist.id, itemId), eq(eventChecklist.eventId, eventId)))
        .execute();

      audit.log({
        action: "delete",
        resource: "checklist",
        resourceId: itemId,
        metadata: { before },
      });
    });
  }
}
