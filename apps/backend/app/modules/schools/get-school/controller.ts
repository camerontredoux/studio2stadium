import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { E_FORBIDDEN } from "#exceptions/forbidden";
import cache from "@adonisjs/cache/services/main";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

export default class GetSchoolController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const { params } = await ctx.request.validateUsing(validator);
    const session = ctx.auth.getUserOrFail();

    if (session.username !== params.username && session.type !== "dancer") {
      if (session.role !== "admin") {
        throw new E_FORBIDDEN("You are not authorized to view this profile");
      }
    }

    const school = await cache.getOrSet({
      key: `schools:profile:${params.username}`,
      factory: () => service.execute(params.username, session.id),
      ttl: "10m",
    });

    if (!school) {
      throw new E_BAD_REQUEST("School not found", {
        username: params.username,
      });
    }

    return ctx.response.ok(school);
  }
}
