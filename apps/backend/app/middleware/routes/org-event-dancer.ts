import { db } from "#database/connection";
import { eventRosters } from "#database/schema/org-events";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import { and, eq } from "drizzle-orm";

/** Ensures scouting mutations only target a dancer on the active event. */
export default class OrgEventDancerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!ctx.orgEvent) {
      return ctx.response.notFound({ message: "No active event." });
    }

    const dancerRosterId =
      (ctx.params.dancerRosterId as string | undefined) ??
      (ctx.request.input("dancerRosterId") as string | undefined);
    if (!dancerRosterId) {
      return ctx.response.unprocessableEntity({
        message: "Dancer roster is required.",
      });
    }

    const [dancer] = await db
      .select({ id: eventRosters.id })
      .from(eventRosters)
      .where(
        and(
          eq(eventRosters.id, dancerRosterId),
          eq(eventRosters.eventId, ctx.orgEvent.id),
          eq(eventRosters.type, "dancer")
        )
      )
      .limit(1);

    if (!dancer) {
      return ctx.response.forbidden({
        message: "Dancer is not on the active event.",
      });
    }

    return next();
  }
}
