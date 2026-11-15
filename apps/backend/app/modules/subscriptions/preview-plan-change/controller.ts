import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { PreviewPlanChangeService } from "./service.ts";
import { schema } from "./validator.ts";

export default class PreviewPlanChangeController {
  @inject()
  async handle(ctx: HttpContext, service: PreviewPlanChangeService) {
    const user = ctx.auth.getUserOrFail();

    const { plan } = await ctx.request.validateUsing(schema, {
      data: ctx.request.qs(),
    });

    return ctx.response.ok(await service.execute(user.id, plan));
  }
}
