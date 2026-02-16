import cache from "@adonisjs/cache/services/main";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetActivityController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const session = ctx.auth.getUserOrFail();

    const data = await cache.getOrSet({
      key: `users:activity:${session.id}`,
      factory: () => service.execute(session.type, session.profileId),
      ttl: "1m",
    });

    return ctx.response.ok(data);
  }
}
