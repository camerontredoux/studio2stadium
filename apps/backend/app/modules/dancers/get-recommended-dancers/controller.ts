import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class GetRecommendedDancersController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);

    const recommendations = await service.execute(ctx.session.profileId, {
      limit: payload.limit,
    });
    return ctx.response.ok(recommendations);
  }
}
