import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { DeleteChecklistService } from "./service.ts";

export default class DeleteChecklistController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteChecklistService) {
    await service.execute(ctx.params.id, ctx.params.itemId);
    return ctx.response.noContent();
  }
}
