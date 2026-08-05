import { posts } from "#database/schema/global";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import logger from "@adonisjs/core/services/logger";
import drive from "@adonisjs/drive/services/main";
import { eq } from "drizzle-orm";
import { BlogPostDeletedEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator) {
    const post = await this.db.use((db) =>
      db.query.posts.findFirst({
        where: { id: params.id },
        columns: { id: true, attachments: true },
      })
    );

    if (!post) return;

    await this.db.use((db) => db.delete(posts).where(eq(posts.id, params.id)));

    // Best-effort cleanup of the post's attachment objects in R2. A failure
    // here must not fail the delete — the orphan sweep is the safety net for
    // anything left behind.
    const disk = drive.use("r2");
    for (const attachment of post.attachments ?? []) {
      try {
        if (await disk.exists(attachment.key)) {
          await disk.delete(attachment.key);
        }
      } catch (error) {
        logger.error(
          { key: attachment.key, error },
          "Failed to delete blog attachment from R2"
        );
      }
    }

    await BlogPostDeletedEvent.dispatch({ postId: params.id });
  }
}
