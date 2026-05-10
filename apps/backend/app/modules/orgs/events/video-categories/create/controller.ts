import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { CreateVideoCategoryService } from "./service.ts";
import { schema } from "./validator.ts";

export default class CreateVideoCategoryController {
  @inject()
  async handle(ctx: HttpContext, service: CreateVideoCategoryService) {
    const payload = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();
    const result = await service.execute(ctx.params.id, payload, {
      eventId: ctx.params.id,
      actorId: user.id,
    });
    return ctx.response.created(result);
  }
}
