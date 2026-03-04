import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { E_FORBIDDEN } from "#exceptions/forbidden";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { UploadProfileImageService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UploadProfileImageController {
  @inject()
  async handle(ctx: HttpContext, service: UploadProfileImageService) {
    const user = ctx.auth.getUserOrFail();
    const payload = await ctx.request.validateUsing(schema);

    const result = await service.execute(
      {
        id: user.id,
        type: user.type,
        profileId: ctx.session.profileId,
      },
      payload
    );

    if (result?.error === "limit_exceeded") {
      throw new E_FORBIDDEN(result.message);
    }

    if (result?.error === "not_found") {
      throw new E_BAD_REQUEST(result.message);
    }

    return ctx.response.noContent();
  }
}
