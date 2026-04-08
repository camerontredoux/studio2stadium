import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Allows users whose membership is either type=coach or role=admin.
 * Org admins can reach coach routes even if they aren't themselves a
 * coach — this matches the spec's "admin implies coach access for
 * coach-scoped routes" rule.
 */
export default class OrgCoachMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const membership = ctx.orgMembership;
    if (!membership) {
      return ctx.response.forbidden({ message: "Membership not resolved." });
    }
    if (membership.type !== "coach" && membership.role !== "admin") {
      return ctx.response.forbidden({ message: "Coach access required." });
    }
    return next();
  }
}
