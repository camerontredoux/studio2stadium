import { db } from "#database/connection";
import { orgEvents, eventRosters } from "#database/schema/org-events";
import { orgMemberships } from "#database/schema/organizations";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import { and, desc, eq, sql } from "drizzle-orm";

declare module "@adonisjs/core/http" {
  interface HttpContext {
    orgEvent?: typeof orgEvents.$inferSelect;
    orgRoster?: typeof eventRosters.$inferSelect;
  }
}

export default class OrgEventMiddleware {
  async handle(ctx: HttpContext, next: NextFn, mode?: "coachDancerRead") {
    if (!ctx.org) {
      return ctx.response.notFound({ message: "Org not resolved." });
    }

    const [ev] = await db
      .select()
      .from(orgEvents)
      .where(and(eq(orgEvents.orgId, ctx.org.id), eq(orgEvents.isActive, true)))
      .limit(1);

    if (!ev && mode !== "coachDancerRead") {
      return ctx.response.notFound({ message: "No active event." });
    }

    if (ev) ctx.orgEvent = ev;

    // Attach roster row if user is authenticated (soft — not a hard failure).
    try {
      const user = await ctx.auth.getUserOrFail();

      // Admins "viewing as" can hold both a coach and a dancer staff roster, so
      // the LIMIT 1 lookup would be ambiguous. The frontend sends the acting
      // type via `x-act-as-type` while in preview mode; honour it. Real
      // participants only ever have one row, so this is a no-op for them.
      const actAs = ctx.request.header("x-act-as-type");
      const actAsType =
        actAs === "coach" || actAs === "dancer" ? actAs : undefined;

      const [roster] = ev
        ? await db
            .select()
            .from(eventRosters)
            .where(
              and(
                eq(eventRosters.eventId, ev.id),
                eq(eventRosters.userId, user.id),
                ...(actAsType ? [eq(eventRosters.type, actAsType)] : [])
              )
            )
            // Deterministic tiebreaker if an admin has multiple staff rosters and
            // no acting type was supplied.
            .orderBy(desc(eventRosters.createdAt))
            .limit(1)
        : [];
      if (roster) ctx.orgRoster = roster;

      // Non-admin members must have a roster entry for the active event
      if (!roster && user.role !== "admin") {
        const [membership] = await db
          .select({ role: orgMemberships.role, type: orgMemberships.type })
          .from(orgMemberships)
          .where(
            and(
              eq(orgMemberships.userId, user.id),
              eq(orgMemberships.orgId, ctx.org.id)
            )
          )
          .limit(1);
        const browseRosters =
          mode === "coachDancerRead" && membership?.type === "coach"
            ? await db
                .select({ exists: sql<boolean>`true` })
                .from(eventRosters)
                .innerJoin(orgEvents, eq(orgEvents.id, eventRosters.eventId))
                .where(
                  and(
                    eq(orgEvents.orgId, ctx.org.id),
                    eq(eventRosters.userId, user.id),
                    eq(eventRosters.type, "coach")
                  )
                )
                .limit(1)
            : [];
        const canBrowseDancers = browseRosters.length > 0;
        if ((!membership || membership.role !== "admin") && !canBrowseDancers) {
          return ctx.response.forbidden({
            message: "Not on event roster.",
          });
        }
      }
    } catch {
      // unauthenticated — fine
    }

    return next();
  }
}
