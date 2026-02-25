import cache from "@adonisjs/cache/services/main";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

export default class GetDancersController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(validator);

    if (Object.keys(payload).length > 0) {
      const schools = await service.execute(payload);
      return ctx.response.ok(schools);
    }

    const dancers = await cache.getOrSet({
      key: `dancers:list`,
      factory: async () => {
        return await service.execute(payload);
      },
      tags: ["dancers:list"],
      ttl: "1h",
      grace: "24h",
    });

    return ctx.response.ok(dancers);
  }
}
