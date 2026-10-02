import cache from "@adonisjs/cache/services/main";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetPublicStatsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const stats = await cache.getOrSet({
      key: "stats:public",
      factory: () => service.execute(),
      ttl: "5m",
    });

    // Let browsers and any CDN in front of the API reuse the response too.
    ctx.response.header("Cache-Control", "public, max-age=300");
    return ctx.response.ok(stats);
  }
}
