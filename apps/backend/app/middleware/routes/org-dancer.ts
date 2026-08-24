import { grantsOrgAdmin, hasMemberType } from "#shared/org/membership";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Allows users who hold a dancer membership, or who administer the org.
 * Org admins — including Organizers, who administer by definition — can reach
 * dancer routes so they can test the dancer experience (mirrors how orgCoach
 * grants admin access to coach routes).
 */
export default class OrgDancerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const membership = ctx.orgMembership;
    if (!membership) {
      return ctx.response.forbidden({ message: "Membership not resolved." });
    }
    const memberships = ctx.orgMemberships ?? [membership];
    if (!hasMemberType(memberships, "dancer") && !grantsOrgAdmin(membership)) {
      return ctx.response.forbidden({ message: "Dancer access required." });
    }
    return next();
  }
}
