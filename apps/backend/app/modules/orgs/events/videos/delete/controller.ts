import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { DeleteVideoService } from "./service.ts";

export default class DeleteVideoController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteVideoService) {
    const user = ctx.auth.getUserOrFail();
    await service.execute(ctx.params.id, ctx.params.videoId, {
      eventId: ctx.params.id,
      actorId: user.id,
    });
    return ctx.response.noContent();
  }
}
