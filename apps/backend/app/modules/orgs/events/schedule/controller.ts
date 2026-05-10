import { orgEvents } from "#database/schema/org-events";
import type { HttpContext } from "@adonisjs/core/http";
import drive from "@adonisjs/drive/services/main";
import { and, eq } from "drizzle-orm";
import { db } from "#database/connection";

export default class ScheduleController {
  async handle(ctx: HttpContext) {
    const [event] = await db
      .select({ schedulePdfUrl: orgEvents.schedulePdfUrl })
      .from(orgEvents)
      .where(
        and(
          eq(orgEvents.id, ctx.params.id),
          eq(orgEvents.orgId, ctx.org!.id),
        ),
      );

    if (!event?.schedulePdfUrl) {
      return ctx.response.notFound({ message: "No schedule uploaded." });
    }

    const disk = drive.use("r2");
    const url = await disk.getSignedUrl(event.schedulePdfUrl, {
      expiresIn: "1 hour",
    });

    return ctx.response.redirect(url);
  }
}
