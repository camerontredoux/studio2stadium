import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Allows users whose membership is type=dancer or role=admin.
 * Org admins can reach dancer routes so they can test the dancer
 * experience (mirrors how orgCoach grants admin access to coach routes).
 */
export default class OrgDancerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const membership = ctx.orgMembership;
    if (!membership) {
      return ctx.response.forbidden({ message: "Membership not resolved." });
    }
    if (membership.type !== "dancer" && membership.role !== "admin") {
      return ctx.response.forbidden({ message: "Dancer access required." });
    }
    return next();
  }
}
