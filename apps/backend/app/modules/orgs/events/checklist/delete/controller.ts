import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { DeleteChecklistService } from "./service.ts";

export default class DeleteChecklistController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteChecklistService) {
    const user = ctx.auth.getUserOrFail();
    await service.execute(ctx.params.id, ctx.params.itemId, { eventId: ctx.params.id, actorId: user.id });
    return ctx.response.noContent();
  }
}
