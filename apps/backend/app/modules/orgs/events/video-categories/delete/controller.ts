import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { DeleteVideoCategoryService } from "./service.ts";

export default class DeleteVideoCategoryController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteVideoCategoryService) {
    const user = ctx.auth.getUserOrFail();
    try {
      await service.execute(ctx.params.id, ctx.params.categoryId, {
        eventId: ctx.params.id,
        actorId: user.id,
      });
      return ctx.response.noContent();
    } catch (err: any) {
      if (err.message?.includes("videos still use it")) {
        return ctx.response.conflict({ message: err.message });
      }
      throw err;
    }
  }
}
