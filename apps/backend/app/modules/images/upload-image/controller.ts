import { E_FORBIDDEN } from "#exceptions/forbidden";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { UploadImageService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UploadImageController {
  @inject()
  async handle(ctx: HttpContext, service: UploadImageService) {
    const user = ctx.auth.getUserOrFail();
    const payload = await ctx.request.validateUsing(schema);

    const result = await service.execute(user.id, payload);

    if ("error" in result && result.error === "limit_exceeded") {
      throw new E_FORBIDDEN(result.message);
    }

    return result;
  }
}
