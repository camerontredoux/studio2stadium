import { orgEvents } from "#database/schema/org-events";
import { E_NOT_FOUND } from "#exceptions/not-found";
import type { HttpContext } from "@adonisjs/core/http";
import drive from "@adonisjs/drive/services/main";
import { and, eq } from "drizzle-orm";
import { db } from "#database/connection";

/**
 * Streams the schedule file through the API. The frontend renders PDF pages
 * itself with pdf.js where the browser's own viewer fails (iOS Safari draws
 * only page 1 in an iframe). pdf.js must fetch the bytes, and a credentialed
 * fetch cannot follow `GET .../schedule`'s cross-origin redirect to storage.
 */
export default class ScheduleFileController {
  async handle(ctx: HttpContext) {
    const [event] = await db
      .select({ schedulePdfUrl: orgEvents.schedulePdfUrl })
      .from(orgEvents)
      .where(
        and(eq(orgEvents.id, ctx.params.id), eq(orgEvents.orgId, ctx.org!.id))
      );

    if (!event?.schedulePdfUrl) {
      throw new E_NOT_FOUND("No schedule uploaded.");
    }

    const disk = drive.use();
    if (!(await disk.exists(event.schedulePdfUrl))) {
      throw new E_NOT_FOUND("Schedule file is no longer available.");
    }

    const meta = await disk.getMetaData(event.schedulePdfUrl);
    ctx.response.header(
      "Content-Type",
      meta.contentType ?? "application/octet-stream"
    );
    ctx.response.header("Content-Length", String(meta.contentLength));
    ctx.response.header("Cache-Control", "private, no-cache");

    const stream = await disk.getStream(event.schedulePdfUrl);
    return ctx.response.stream(stream);
  }
}
