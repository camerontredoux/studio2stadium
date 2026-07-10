import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { E_FORBIDDEN } from "#exceptions/forbidden";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { AddYoutubeVideoService } from "./service.ts";
import { schema } from "./validator.ts";

export default class AddYoutubeVideoController {
  @inject()
  async handle(ctx: HttpContext, service: AddYoutubeVideoService) {
    const payload = await ctx.request.validateUsing(schema);
    const userId = ctx.auth.user!.id;

    const result = await service.execute(userId, payload);

    if ("error" in result) {
      if (result.error !== "duplicate") {
        throw new E_FORBIDDEN(result.message);
      }
      throw new E_BAD_REQUEST(result.message);
    }

    return ctx.response.created(result.video);
  }
}
