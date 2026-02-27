import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { UploadImageService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UploadImageController {
  @inject()
  async handle(ctx: HttpContext, service: UploadImageService) {
    const user = ctx.auth.getUserOrFail();
    const type = await ctx.request.validateUsing(schema);

    return await service.execute(user.id, type);
  }
}
