import type { db } from "./connection.ts";
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
  | "invite"
  | "video_category"
  | "video";

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

    const parents = this.entries.filter((e) => !e.parentId);
    const children = this.entries.filter((e) => e.parentId);

    const toRow = (entry: AuditEntry, resolvedParentId?: string) => ({
      eventId: ctx.eventId,
      actorId: ctx.actorId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId ?? null,
      metadata: entry.metadata ?? null,
      parentId: resolvedParentId ?? null,
    });

    // resourceId → eventAuditLog.id for resolving children's parentId
    const resourceIdToAuditId = new Map<string, string>();

    if (parents.length > 0) {
      const inserted = await tx
        .insert(eventAuditLog)
        .values(parents.map((e) => toRow(e)))
        .returning({
          id: eventAuditLog.id,
          resourceId: eventAuditLog.resourceId,
        });
      for (const row of inserted) {
        if (row.resourceId) resourceIdToAuditId.set(row.resourceId, row.id);
      }
    }

    if (children.length > 0) {
      await tx.insert(eventAuditLog).values(
        children.map((e) => {
          const resolvedParentId = e.parentId
            ? (resourceIdToAuditId.get(e.parentId) ?? e.parentId)
            : undefined;
          return toRow(e, resolvedParentId);
        })
      );
    }
  }
}
