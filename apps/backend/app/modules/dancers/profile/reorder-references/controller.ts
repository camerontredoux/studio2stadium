import cache from "@adonisjs/cache/services/main";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class ReorderReferencesController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const user = ctx.auth.getUserOrFail();
    const payload = await ctx.request.validateUsing(schema);

    await service.execute(ctx.session.profileId, payload);

    // Schools read profiles from the cache, so drop it or they keep seeing
    // the old order.
    await cache.delete({ key: `dancers:profile:${user.username}` });

    return ctx.response.noContent();
  }
}
