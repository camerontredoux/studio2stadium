import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { deleteEventSchema } from "./schema.ts";
import { DeleteEventService } from "./service.ts";

export default class DeleteEventController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteEventService) {
    const payload = await ctx.request.validateUsing(deleteEventSchema);

    await service.execute(payload);

    return ctx.response.noContent();
  }
}
