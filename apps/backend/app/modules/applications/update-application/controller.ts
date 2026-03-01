import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { updateApplicationSchema } from "./validator.ts";

export default class UpdateApplicationController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(updateApplicationSchema);

    await service.execute(ctx.session.profileId, payload);

    return ctx.response.noContent();
  }
}
