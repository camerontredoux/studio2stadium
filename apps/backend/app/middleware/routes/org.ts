import { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import { eq } from "drizzle-orm";

declare module "@adonisjs/core/http" {
  interface HttpContext {
    org?: typeof organizations.$inferSelect;
  }
}

/**
 * Resolves an organization from the :slug URL param, attaches it to
 * ctx.org, and short-circuits with 404 if the slug doesn't exist.
 *
 * Intended to be composed before any org-scoped middleware (orgMember,
 * orgAdmin, orgEvent, etc.).
 */
export default class OrgMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const slug = ctx.params.slug;
    if (!slug) {
      return ctx.response.notFound({
        message: "Organization not specified.",
      });
    }

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);

    if (!org) {
      return ctx.response.notFound({
        message: "Organization not found.",
      });
    }

    ctx.org = org;
    return next();
  }
}
