import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { createEventSchema } from "./schema.ts";
import { CreateEventService } from "./service.ts";

export default class CreateEventController {
  @inject()
  async handle(ctx: HttpContext, service: CreateEventService) {
    const payload = await ctx.request.validateUsing(createEventSchema);

    await service.execute(payload, ctx.session.profileId);

    return ctx.response.noContent();
  }
}
