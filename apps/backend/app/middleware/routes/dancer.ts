import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

export default class DancerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail();

    if (user.type !== "dancer") {
      return ctx.response.forbidden({
        message: "This resource is only available to dancers.",
      });
    }

    await next();
  }
}
