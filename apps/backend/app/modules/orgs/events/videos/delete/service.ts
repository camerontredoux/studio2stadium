import { DatabaseService } from "#database/service";
import { eventVideos } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import type { AuditContext } from "#database/audit";

@inject()
export class DeleteVideoService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string, videoId: string, auditCtx: AuditContext) {
    return this.db.withAudit(auditCtx, async (tx, audit) => {
      const [before] = await tx
        .select()
        .from(eventVideos)
        .where(
          and(eq(eventVideos.id, videoId), eq(eventVideos.eventId, eventId))
        );

      await tx
        .delete(eventVideos)
        .where(
          and(eq(eventVideos.id, videoId), eq(eventVideos.eventId, eventId))
        )
        .execute();

      audit.log({
        action: "delete",
        resource: "video",
        resourceId: videoId,
        metadata: { before },
      });
    });
  }
}
