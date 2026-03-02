import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { submitApplicationSchema } from "./schema.ts";
import { SubmitApplicationService } from "./service.ts";

export default class SubmitApplicationController {
  @inject()
  async handle(ctx: HttpContext, service: SubmitApplicationService) {
    const payload = await ctx.request.validateUsing(submitApplicationSchema);

    await service.execute(ctx.session.profileId, ctx.session.id, payload);

    await ctx.auth.use("redis").bump();

    return ctx.response.noContent();
  }
}
