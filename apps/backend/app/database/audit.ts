import { db } from "./connection.ts";
import { eventAuditLog } from "./schema/org-events.ts";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type AuditAction =
  | "upload"
  | "create"
  | "update"
  | "delete"
  | "activate"
  | "resend_invite";

export type AuditResource =
  | "roster"
  | "event"
  | "checklist"
  | "csv_upload"
  | "invite";

export interface AuditContext {
  eventId: string;
  actorId: string;
}

export interface AuditEntry {
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  parentId?: string;
}

export class AuditCollector {
  private entries: AuditEntry[] = [];

  log(entry: AuditEntry): void {
    this.entries.push(entry);
  }

  async flush(tx: Transaction, ctx: AuditContext): Promise<void> {
    if (this.entries.length === 0) return;

    await tx.insert(eventAuditLog).values(
      this.entries.map((entry) => ({
        eventId: ctx.eventId,
        actorId: ctx.actorId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId ?? null,
        metadata: entry.metadata ?? null,
        parentId: entry.parentId ?? null,
      }))
    );
  }
}
