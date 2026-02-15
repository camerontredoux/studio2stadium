import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class FollowSchoolController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const session = ctx.auth.getUserOrFail();
    const payload = await ctx.request.validateUsing(schema);

    const result = await service.execute(payload, session.profileId);

    if (result.created) {
      return ctx.response.created();
    }

    return ctx.response.noContent();
  }
}
