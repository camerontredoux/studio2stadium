import { orgEvents } from "#database/schema/org-events";
import { E_NOT_FOUND } from "#exceptions/not-found";
import type { HttpContext } from "@adonisjs/core/http";
import drive from "@adonisjs/drive/services/main";
import { and, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "#database/connection";

// Long enough that a dancer reopening the schedule all weekend never refetches it.
const VERSIONED_MAX_AGE = 7 * 24 * 60 * 60;

/**
 * Streams the schedule file through the API. The frontend fetches the file
 * from storage itself (`GET .../schedule/url`) and uses this route only when
 * that fails, for example when storage refuses the cross-origin read.
 *
 * Each upload gets a new key, so the bytes behind a key never change. The
 * ETag comes from the key, so a revalidation is answered with a 304 without
 * touching storage. With `?v=<key>` matching the current key, the browser may
 * keep the file for a week and repeat opens never reach the API.
 */
export default class ScheduleFileController {
  async handle(ctx: HttpContext) {
    const [event] = await db
      .select({ schedulePdfUrl: orgEvents.schedulePdfUrl })
      .from(orgEvents)
      .where(
        and(eq(orgEvents.id, ctx.params.id), eq(orgEvents.orgId, ctx.org!.id))
      );

    const key = event?.schedulePdfUrl;
    if (!key) {
      throw new E_NOT_FOUND("No schedule uploaded.");
    }

    const etag = `"${createHash("sha256").update(key).digest("base64url")}"`;
    ctx.response.header("ETag", etag);
    ctx.response.header(
      "Cache-Control",
      ctx.request.qs().v === key
        ? `private, max-age=${VERSIONED_MAX_AGE}, immutable`
        : "private, no-cache"
    );
    // `request.fresh()` can't see headers that are still buffered on the
    // response, so compare the validator here.
    const ifNoneMatch = ctx.request.header("if-none-match") ?? "";
    if (ifNoneMatch.split(",").some((tag) => tag.trim() === etag)) {
      return ctx.response.notModified();
    }

    const disk = drive.use();
    if (!(await disk.exists(key))) {
      throw new E_NOT_FOUND("Schedule file is no longer available.");
    }

    const meta = await disk.getMetaData(key);
    ctx.response.header(
      "Content-Type",
      meta.contentType ?? "application/octet-stream"
    );
    ctx.response.header("Content-Length", String(meta.contentLength));

    const stream = await disk.getStream(key);
    return ctx.response.stream(stream);
  }
}
