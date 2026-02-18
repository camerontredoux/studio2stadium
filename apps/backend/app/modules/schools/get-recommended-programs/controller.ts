import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class GetRecommendedProgramsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);

    const debug = ctx.request.qs().debug === "true";
    const recommendations = await service.execute(ctx.session.profileId, {
      debug,
      limit: payload.limit,
    });
    return ctx.response.ok(recommendations);
  }
}
