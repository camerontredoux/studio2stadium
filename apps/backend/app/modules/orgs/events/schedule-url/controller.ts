import { orgEvents } from "#database/schema/org-events";
import { E_NOT_FOUND } from "#exceptions/not-found";
import type { HttpContext } from "@adonisjs/core/http";
import drive from "@adonisjs/drive/services/main";
import { and, eq } from "drizzle-orm";
import { db } from "#database/connection";

/**
 * Returns a signed storage URL for the schedule file as JSON. The frontend
 * fetches it without credentials, so the file's bytes go from storage to the
 * browser and never through the API. `GET .../schedule` redirects to the same
 * kind of URL, but a script can't read a cross-origin redirect's target.
 */
export default class ScheduleUrlController {
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

    const url = await drive.use().getSignedUrl(event.schedulePdfUrl, {
      expiresIn: "1 hour",
    });

    ctx.response.header("Cache-Control", "private, no-store");
    return { url };
  }
}
