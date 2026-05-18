import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { UpdateEventService, StartTimePairError } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpdateEventController {
  @inject()
  async handle(ctx: HttpContext, service: UpdateEventService) {
    const payload = await ctx.request.validateUsing(schema);
    try {
      const ev = await service.execute(ctx.org!.id, ctx.params.id, payload, {
        eventId: ctx.params.id,
        actorId: ctx.auth.getUserOrFail().id,
      });
      return ev ? ctx.response.ok(ev) : ctx.response.notFound();
    } catch (err) {
      if (err instanceof StartTimePairError) {
        return ctx.response.unprocessableEntity({ message: err.message });
      }
      throw err;
    }
  }
}
