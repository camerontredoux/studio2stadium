import { type BlogAttachment } from "#database/schema/global";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  /**
   * Resolve a post + attachment id to the attachment record. The R2 object key
   * lives only in the returned record and is never exposed to clients — the
   * controller streams the object rather than redirecting to storage.
   */
  async execute({ params }: Validator): Promise<BlogAttachment | null> {
    const post = await this.db.use((db) =>
      db.query.posts.findFirst({
        where: { id: params.postId },
        columns: { attachments: true },
      })
    );

    if (!post) return null;

    return post.attachments?.find((a) => a.id === params.attachmentId) ?? null;
  }
}
