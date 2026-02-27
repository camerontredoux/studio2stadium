import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { UpdateAchievementService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpdateAchievementController {
  @inject()
  async handle(ctx: HttpContext, service: UpdateAchievementService) {
    const payload = await ctx.request.validateUsing(schema);

    await service.execute(payload);

    return ctx.response.noContent();
  }
}
