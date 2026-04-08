import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Gates a route behind an org's `features` JSONB flag.
 *
 * Usage (inside a route group that's already resolved ctx.org):
 *
 *   router
 *     .post("callbacks", [CreateCallback])
 *     .use(middleware.orgFeature("callbacks"));
 *
 * If the feature key is missing or falsy, the middleware 404s (not
 * 403) so the route is *invisible* to clients whose org doesn't have
 * the feature enabled, rather than teasing it as "disabled".
 */
export default class OrgFeatureMiddleware {
  async handle(ctx: HttpContext, next: NextFn, key: string) {
    const features = (ctx.org?.features ?? {}) as Record<string, boolean>;
    if (!features[key]) {
      return ctx.response.notFound({ message: "Not found." });
    }
    return next();
  }
}
