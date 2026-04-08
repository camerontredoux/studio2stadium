import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Requires the user's org membership to be type=dancer. Unlike
 * orgCoach, this does NOT grant access to org admins — admin-only
 * dancer-scoped routes should compose orgAdmin instead.
 */
export default class OrgDancerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const membership = ctx.orgMembership;
    if (!membership) {
      return ctx.response.forbidden({ message: "Membership not resolved." });
    }
    if (membership.type !== "dancer") {
      return ctx.response.forbidden({ message: "Dancer access required." });
    }
    return next();
  }
}
