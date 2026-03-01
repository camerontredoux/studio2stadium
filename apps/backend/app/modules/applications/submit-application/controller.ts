import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { submitApplicationSchema } from "./schema.ts";
import { SubmitApplicationService } from "./service.ts";

export default class SubmitApplicationController {
  @inject()
  async handle(ctx: HttpContext, service: SubmitApplicationService) {
    const payload = await ctx.request.validateUsing(submitApplicationSchema);

    await service.execute(ctx.session.profileId, payload);

    return ctx.response.noContent();
  }
}
