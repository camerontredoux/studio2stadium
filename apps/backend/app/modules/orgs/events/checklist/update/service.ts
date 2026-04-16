import { DatabaseService } from "#database/service";
import { eventChecklist } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import type { Validator } from "./validator.ts";
import type { AuditContext } from "#database/audit";

@inject()
export class UpdateChecklistService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string, itemId: string, input: Validator, auditCtx: AuditContext) {
    return this.db.withAudit(auditCtx, async (tx, audit) => {
      const [before] = await tx
        .select()
        .from(eventChecklist)
        .where(and(eq(eventChecklist.id, itemId), eq(eventChecklist.eventId, eventId)));

      const result = await tx
        .update(eventChecklist)
        .set(input)
        .where(and(eq(eventChecklist.id, itemId), eq(eventChecklist.eventId, eventId)))
        .returning();

      audit.log({
        action: "update",
        resource: "checklist",
        resourceId: itemId,
        metadata: { before, after: result[0] },
      });

      return result;
    });
  }
}
