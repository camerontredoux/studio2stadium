import cache from "@adonisjs/cache/services/main";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetPostsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const posts = await cache.getOrSet({
      key: "blog:posts",
      factory: () => service.execute(),
      ttl: "24h",
    });
    return ctx.response.ok(posts);
  }
}
