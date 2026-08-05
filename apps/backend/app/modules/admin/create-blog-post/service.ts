import { type BlogAttachment, posts } from "#database/schema/global";
import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import {
  BLOG_ATTACHMENTS,
  isValidBlogAttachmentKey,
} from "#modules/blog/shared/attachments";
import { inject } from "@adonisjs/core";
import drive from "@adonisjs/drive/services/main";
import { randomUUID } from "node:crypto";
import { BlogPostCreatedEvent } from "./event.ts";
import { Validator } from "./validator.ts";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(payload: Validator) {
    const slug = slugify(payload.title);
    const attachments = await this.verifyAttachments(payload.attachments ?? []);

    const [created] = await this.db.use((db) =>
      db
        .insert(posts)
        .values({
          slug,
          title: payload.title,
          content: payload.content,
          description: payload.description,
          thumbnail: payload.thumbnail,
          tags: payload.tags,
          attachments: attachments.length > 0 ? attachments : null,
        })
        .returning({ id: posts.id })
    );

    await BlogPostCreatedEvent.dispatch({ postId: created.id });

    return { id: created.id };
  }

  /**
   * Turn client-supplied attachment references into trusted, persistable
   * records. R2 object metadata is the source of truth for size/contentType.
   *
   * Order (fail fast, cheap checks first):
   *   1. Reject anything past the per-post file count.
   *   2. Reject keys that don't match our presign key shape (blocks attaching
   *      arbitrary/foreign objects).
   *   3. HEAD each object: it must exist, be a PDF, and be within the per-file
   *      size limit.
   *   4. Sum verified sizes and enforce the per-post total.
   */
  private async verifyAttachments(
    input: Validator["attachments"] & {}
  ): Promise<BlogAttachment[]> {
    if (input.length === 0) return [];

    if (input.length > BLOG_ATTACHMENTS.maxFiles) {
      throw new E_BAD_REQUEST(
        `A blog post can have at most ${BLOG_ATTACHMENTS.maxFiles} attachments.`
      );
    }

    const disk = drive.use("r2");
    const verified: BlogAttachment[] = [];
    let totalSize = 0;

    for (const item of input) {
      if (!isValidBlogAttachmentKey(item.key)) {
        throw new E_BAD_REQUEST("Invalid attachment reference.");
      }

      const exists = await disk.exists(item.key);
      if (!exists) {
        throw new E_BAD_REQUEST(
          `Attachment "${item.name}" was not found in storage. Please re-upload it.`
        );
      }

      const meta = await disk.getMetaData(item.key);

      if (meta.contentType !== BLOG_ATTACHMENTS.contentType) {
        throw new E_BAD_REQUEST(`Attachment "${item.name}" must be a PDF.`);
      }

      if (meta.contentLength > BLOG_ATTACHMENTS.maxFileSize) {
        throw new E_BAD_REQUEST(
          `Attachment "${item.name}" exceeds the 10 MB per-file limit.`
        );
      }

      totalSize += meta.contentLength;

      verified.push({
        id: randomUUID(),
        name: item.name,
        key: item.key,
        size: meta.contentLength,
        contentType: meta.contentType,
        uploadedAt: (meta.lastModified ?? new Date()).toISOString(),
      });
    }

    if (totalSize > BLOG_ATTACHMENTS.maxTotalSize) {
      throw new E_BAD_REQUEST(
        "Attachments exceed the 25 MB total limit for a blog post."
      );
    }

    return verified;
  }
}
