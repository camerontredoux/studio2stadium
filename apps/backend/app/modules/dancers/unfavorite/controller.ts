import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class UnfavoriteDancerController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);

    const platform = ctx.session.platforms[0];

    await service.execute(payload, ctx.session.profileId, platform);

    return ctx.response.noContent();
  }
}
