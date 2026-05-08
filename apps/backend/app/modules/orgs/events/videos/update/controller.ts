import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { UpdateVideoService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpdateVideoController {
  @inject()
  async handle(ctx: HttpContext, service: UpdateVideoService) {
    const payload = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();
    const result = await service.execute(
      ctx.params.id,
      ctx.params.videoId,
      payload,
      { eventId: ctx.params.id, actorId: user.id }
    );
    return ctx.response.ok(result);
  }
}
