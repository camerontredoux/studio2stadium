import { grantsOrgAdmin } from "#shared/org/membership";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Requires the authenticated user to administer the org — either role=admin, or
 * a membership of type organizer, which administers by definition (ADR 0003).
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
    if (!grantsOrgAdmin(membership)) {
      return ctx.response.forbidden({ message: "Admin access required." });
    }
    return next();
  }
}
