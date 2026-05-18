import { DatabaseService } from "#database/service";
import { eventVideos } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import type { Validator } from "./validator.ts";
import type { AuditContext } from "#database/audit";

@inject()
export class UpdateVideoService {
  constructor(private db: DatabaseService) {}

  async execute(
    eventId: string,
    videoId: string,
    input: Validator,
    auditCtx: AuditContext
  ) {
    return this.db.withAudit(auditCtx, async (tx, audit) => {
      const [before] = await tx
        .select()
        .from(eventVideos)
        .where(
          and(eq(eventVideos.id, videoId), eq(eventVideos.eventId, eventId))
        );

      const [item] = await tx
        .update(eventVideos)
        .set({
          title: input.title,
          categoryId: input.categoryId,
          youtubeId: input.youtubeId,
          ...(input.audioKey !== undefined && { audioKey: input.audioKey }),
          ...(input.audioFilename !== undefined && {
            audioFilename: input.audioFilename,
          }),
        })
        .where(
          and(eq(eventVideos.id, videoId), eq(eventVideos.eventId, eventId))
        )
        .returning();

      audit.log({
        action: "update",
        resource: "video",
        resourceId: videoId,
        metadata: { before, after: item },
      });

      return item!;
    });
  }
}
