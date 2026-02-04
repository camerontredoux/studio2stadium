import cache from "@adonisjs/cache/services/main";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

export default class ListSchoolsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(validator);

    const schools = await cache.getOrSet({
      key: `schools:list:${payload.cursor ?? "initial"}`,
      factory: async () => {
        return await service.execute(payload);
      },
      tags: ["schools:list"],
      ttl: "1h",
      grace: "24h",
    });

    return ctx.response.ok(schools);
  }
}
