import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { DeleteEventService, PurchasedEventDeleteError } from "./service.ts";

export default class DeleteEventController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteEventService) {
    try {
      const found = await service.execute(ctx.org!.id, ctx.params.id);

      return found ? ctx.response.noContent() : ctx.response.notFound();
    } catch (err) {
      if (err instanceof PurchasedEventDeleteError) {
        return ctx.response.conflict({ message: err.message });
      }
      throw err;
    }
  }
}
