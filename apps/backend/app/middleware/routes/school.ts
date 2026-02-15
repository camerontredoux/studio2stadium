import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

export default class SchoolMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail();

    if (user.type !== "school") {
      return ctx.response.forbidden({
        message: "This resource is only available to school accounts.",
      });
    }

    await next();
  }
}
