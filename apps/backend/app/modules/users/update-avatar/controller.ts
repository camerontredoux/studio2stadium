import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { UpdateAvatarService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpdateAvatarController {
  @inject()
  async handle(ctx: HttpContext, service: UpdateAvatarService) {
    const user = ctx.auth.getUserOrFail();
    const payload = await ctx.request.validateUsing(schema);

    const response = await service.execute(user.id, user.avatar, payload);

    if (response?.error) {
      return ctx.response.badRequest(response.error);
    }

    await ctx.auth.use("redis").bump();

    return ctx.response.noContent();
  }
}
