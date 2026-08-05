import { BaseCommand, flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import drive from "@adonisjs/drive/services/main";
import { db } from "#database/connection";
import { posts } from "#database/schema/global";
import { BLOG_ATTACHMENTS } from "#modules/blog/shared/attachments";

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Delete objects under the `blog/` prefix that no post references and that are
 * older than 24 hours. This is the fallback for files uploaded via presign but
 * never attached to a saved post (e.g. an admin who removed a PDF or abandoned
 * a draft). The age floor avoids deleting files while a post is still being
 * drafted.
 *
 * Intended to be run periodically by an external scheduler (see the `backfill:*`
 * commands for the same run-as-a-command pattern).
 */
export default class SweepBlogOrphans extends BaseCommand {
  static commandName = "sweep:blog-orphans";
  static description =
    "Delete unreferenced blog/ objects in R2 older than 24 hours";

  static options: CommandOptions = {
    startApp: true,
  };

  @flags.boolean({
    description: "List what would be deleted without deleting anything",
  })
  declare dryRun: boolean;

  async run() {
    const disk = drive.use("r2");

    // Build the set of keys still in use: attachment keys (structured) plus any
    // key that appears inside post content (blog content images are stored
    // under the same `blog/` prefix and embedded as URLs in the HTML).
    const rows = await db
      .select({ content: posts.content, attachments: posts.attachments })
      .from(posts);

    const referencedKeys = new Set<string>();
    let contentBlob = "";
    for (const row of rows) {
      contentBlob += row.content;
      for (const attachment of row.attachments ?? []) {
        referencedKeys.add(attachment.key);
      }
    }

    const isReferenced = (key: string) =>
      referencedKeys.has(key) || contentBlob.includes(key);

    const cutoff = Date.now() - MAX_AGE_MS;
    let scanned = 0;
    let deleted = 0;
    let paginationToken: string | undefined;

    do {
      const result = await disk.listAll(BLOG_ATTACHMENTS.prefix, {
        recursive: true,
        paginationToken,
      });

      for (const object of result.objects) {
        if (!object.isFile) continue;
        scanned += 1;

        if (isReferenced(object.key)) continue;

        const meta = await object.getMetaData();
        const lastModified = meta.lastModified?.getTime() ?? Date.now();
        if (lastModified > cutoff) continue;

        if (this.dryRun) {
          this.logger.info(`[dry-run] would delete ${object.key}`);
        } else {
          await disk.delete(object.key);
          this.logger.action(`delete ${object.key}`).succeeded();
        }
        deleted += 1;
      }

      paginationToken = result.paginationToken;
    } while (paginationToken);

    this.logger.success(
      `${this.dryRun ? "[dry-run] " : ""}Scanned ${scanned} object(s), ${
        this.dryRun ? "would delete" : "deleted"
      } ${deleted} orphan(s).`
    );
  }
}
