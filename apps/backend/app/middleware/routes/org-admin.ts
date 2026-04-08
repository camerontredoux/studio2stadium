import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Requires the authenticated user's org membership to have role=admin.
 * Must be composed after `orgMember` so `ctx.orgMembership` is populated.
 */
export default class OrgAdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const membership = ctx.orgMembership;
    if (!membership) {
      return ctx.response.forbidden({
        message: "Membership not resolved.",
      });
    }
    if (membership.role !== "admin") {
      return ctx.response.forbidden({ message: "Admin access required." });
    }
    return next();
  }
}
