import { grantsOrgAdmin, hasMemberType } from "#shared/org/membership";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Allows users who hold a coach membership, or who administer the org.
 * Org admins — including Organizers, who administer by definition — can reach
 * coach routes even if they aren't themselves a coach; this matches the spec's
 * "admin implies coach access for coach-scoped routes" rule. Reaching a coach
 * route this way never makes an Organizer a Coach: it grants no Roster Entry
 * and no place in any coach-facing list.
 */
export default class OrgCoachMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const membership = ctx.orgMembership;
    if (!membership) {
      return ctx.response.forbidden({ message: "Membership not resolved." });
    }
    const memberships = ctx.orgMemberships ?? [membership];
    if (!hasMemberType(memberships, "coach") && !grantsOrgAdmin(membership)) {
      return ctx.response.forbidden({ message: "Coach access required." });
    }
    return next();
  }
}
