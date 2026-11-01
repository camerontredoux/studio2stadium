import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { E_NOT_FOUND } from "#exceptions/not-found";
import cache from "@adonisjs/cache/services/main";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { DeleteProfileVideoService } from "./service.ts";
import { schema } from "./validator.ts";

export default class DeleteProfileVideoController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteProfileVideoService) {
    const payload = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();

    try {
      await service.execute(user.id, payload);
    } catch (e) {
      if (e instanceof E_NOT_FOUND) {
        throw e;
      }
      if (e instanceof Error) {
        throw new E_BAD_REQUEST(e.message);
      }
      throw new E_BAD_REQUEST("Failed to delete video");
    }

    // Schools read profiles from the cache, so drop it or they keep seeing
    // the deleted video.
    await cache.deleteMany({
      keys: [
        `dancers:profile:${user.username}`,
        `schools:profile:${user.username}`,
      ],
    });

    return ctx.response.noContent();
  }
}
