import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { CreateChecklistService } from "./service.ts";
import { schema } from "./validator.ts";

export default class CreateChecklistController {
  @inject()
  async handle(ctx: HttpContext, service: CreateChecklistService) {
    const payload = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();
    const result = await service.execute(ctx.params.id, payload, { eventId: ctx.params.id, actorId: user.id });
    return ctx.response.created(result);
  }
}
