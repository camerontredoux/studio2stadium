import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class FavoriteDancerController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);

    const platform = ctx.session.platforms[0];

    const result = await service.execute(
      payload,
      ctx.session.profileId,
      platform
    );

    if (result.created) {
      return ctx.response.created(result);
    }

    return ctx.response.noContent();
  }
}
