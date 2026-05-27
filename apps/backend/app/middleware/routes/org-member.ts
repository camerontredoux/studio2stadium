import { db } from "#database/connection";
import { orgMemberships } from "#database/schema/organizations";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import { and, eq } from "drizzle-orm";

declare module "@adonisjs/core/http" {
  interface HttpContext {
    orgMembership?: typeof orgMemberships.$inferSelect;
  }
}

/**
 * Requires the authenticated user to have an `org_memberships` row for
 * the org resolved by `org` middleware. Attaches the membership row to
 * ctx.orgMembership so downstream role checks can read `role` + `type`
 * without re-querying.
 */
export default class OrgMemberMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail();
    if (!ctx.org) {
      return ctx.response.notFound({ message: "Organization not resolved." });
    }

    // System admins can access any org without membership
    if (user.role === "admin") {
      ctx.orgMembership = {
        id: "system-admin",
        userId: user.id,
        orgId: ctx.org.id,
        role: "admin",
        type: "coach",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as typeof orgMemberships.$inferSelect;
      return next();
    }

    const [membership] = await db
      .select()
      .from(orgMemberships)
      .where(
        and(
          eq(orgMemberships.userId, user.id),
          eq(orgMemberships.orgId, ctx.org.id)
        )
      )
      .limit(1);

    if (!membership) {
      return ctx.response.forbidden({
        message: "You are not a member of this organization.",
      });
    }

    ctx.orgMembership = membership;
    return next();
  }
}
