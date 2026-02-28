import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { editEventSchema } from "./schema.ts";
import { EditEventService } from "./service.ts";

export default class EditEventController {
  @inject()
  async handle(ctx: HttpContext, service: EditEventService) {
    const payload = await ctx.request.validateUsing(editEventSchema);

    await service.execute(payload);

    return ctx.response.noContent();
  }
}
