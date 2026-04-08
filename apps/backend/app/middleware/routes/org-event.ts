import { db } from "#database/connection";
import { orgEvents, eventRosters } from "#database/schema/org-events";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import { and, eq } from "drizzle-orm";

declare module "@adonisjs/core/http" {
  interface HttpContext {
    orgEvent?: typeof orgEvents.$inferSelect;
    orgRoster?: typeof eventRosters.$inferSelect;
  }
}

export default class OrgEventMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!ctx.org) {
      return ctx.response.notFound({ message: "Org not resolved." });
    }

    const [ev] = await db
      .select()
      .from(orgEvents)
      .where(and(eq(orgEvents.orgId, ctx.org.id), eq(orgEvents.isActive, true)))
      .limit(1);

    if (!ev) {
      return ctx.response.notFound({ message: "No active event." });
    }

    ctx.orgEvent = ev;

    // Attach roster row if user is authenticated (soft — not a hard failure).
    try {
      const user = await ctx.auth.getUserOrFail();
      const [roster] = await db
        .select()
        .from(eventRosters)
        .where(and(eq(eventRosters.eventId, ev.id), eq(eventRosters.userId, user.id)))
        .limit(1);
      if (roster) ctx.orgRoster = roster;
    } catch {
      // unauthenticated — fine
    }

    return next();
  }
}
