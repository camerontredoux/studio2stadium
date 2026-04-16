import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { UpdateEventService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpdateEventController {
  @inject()
  async handle(ctx: HttpContext, service: UpdateEventService) {
    const payload = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();
    const ev = await service.execute(ctx.org!.id, ctx.params.id, payload, { eventId: ctx.params.id, actorId: user.id });
    if (!ev) return ctx.response.notFound({ message: "Event not found." });
    return ctx.response.ok(ev);
  }
}
