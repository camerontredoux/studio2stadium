import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { UpdateProgramService } from "./service.ts";
import { updateProgramSchema } from "./validator.ts";

export default class UpdateProgramController {
  @inject()
  async handle(ctx: HttpContext, service: UpdateProgramService) {
    const payload = await ctx.request.validateUsing(updateProgramSchema);

    await service.execute(ctx.session.profileId, payload);

    return ctx.response.noContent();
  }
}
