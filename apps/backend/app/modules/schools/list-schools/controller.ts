import cache from "@adonisjs/cache/services/main";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

export default class ListSchoolsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const user = ctx.auth.getUserOrFail();
    const override = user.role === "admin";

    const payload = await ctx.request.validateUsing(validator);
    const { upcomingEvents, ...filters } = payload;

    if (Object.keys(filters).length || override) {
      const schools = await service.execute(payload, override);
      return ctx.response.ok(schools);
    }

    const key = upcomingEvents ? "schools:list:upcoming" : "schools:list";

    const schools = await cache.getOrSet({
      key,
      factory: () => service.execute(payload, override),
      ttl: "1h",
      grace: "24h",
    });

    return ctx.response.ok(schools);
  }
}
