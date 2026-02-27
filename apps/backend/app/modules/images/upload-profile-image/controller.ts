import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { UploadProfileImageService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UploadProfileImageController {
  @inject()
  async handle(ctx: HttpContext, service: UploadProfileImageService) {
    const user = ctx.auth.getUserOrFail();
    const payload = await ctx.request.validateUsing(schema);

    await service.execute(user.id, payload);

    return ctx.response.noContent();
  }
}
