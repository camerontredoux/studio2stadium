import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { DeleteEventService } from "./service.ts";

export default class DeleteEventController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteEventService) {
    const found = await service.execute(ctx.org!.id, ctx.params.id);

    return found ? ctx.response.noContent() : ctx.response.notFound();
  }
}
