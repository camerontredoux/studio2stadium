import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { E_FORBIDDEN } from "#exceptions/forbidden";
import cache from "@adonisjs/cache/services/main";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class GetSchoolController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const session = ctx.auth.getUserOrFail();
    const { params } = await ctx.request.validateUsing(schema);

    const isOwner = session.username === params.username;
    const isDancer = session.type === "dancer";
    const isAdmin = session.role === "admin";

    if (!isOwner && !isDancer && !isAdmin) {
      throw new E_FORBIDDEN("You are not authorized to view this profile");
    }

    if (isOwner) {
      const school = await service.execute(params.username);
      if (!school)
        throw new E_BAD_REQUEST("School not found", {
          username: params.username,
        });
      return ctx.response.ok(school);
    }

    const school = await cache.getOrSet({
      key: `schools:profile:${params.username}`,
      factory: () => service.execute(params.username),
      ttl: "10m",
    });

    if (!school)
      throw new E_BAD_REQUEST("School not found", {
        username: params.username,
      });
    return ctx.response.ok(school);
  }
}
