import cache from "@adonisjs/cache/services/main";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

export default class GetDancersController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const user = ctx.auth.getUserOrFail();
    const override = user.role === "admin";

    const payload = await ctx.request.validateUsing(validator);

    if (Object.keys(payload).length || override) {
      const dancers = await service.execute(payload, override, user.id);
      return ctx.response.ok(dancers);
    }

    const dancers = await cache.getOrSet({
      key: "dancers:list",
      factory: () => service.execute(payload, override, user.id),
      ttl: "10m",
    });

    return ctx.response.ok(dancers);
  }
}
