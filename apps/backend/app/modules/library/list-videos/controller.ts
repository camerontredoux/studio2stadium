import cache from "@adonisjs/cache/services/main";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class ListVideosController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    if (ctx.auth.user?.role === "admin") {
      const videos = await service.execute();
      return ctx.response.ok(videos);
    }

    const videos = await cache.getOrSet({
      key: "library:videos",
      factory: () => service.execute(),
      ttl: "24h",
    });

    return ctx.response.ok(videos);
  }
}
