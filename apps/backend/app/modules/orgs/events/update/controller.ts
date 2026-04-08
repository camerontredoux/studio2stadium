import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { UpdateEventService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpdateEventController {
  @inject()
  async handle(ctx: HttpContext, service: UpdateEventService) {
    const payload = await ctx.request.validateUsing(schema);
    const ev = await service.execute(ctx.org!.id, ctx.params.id, payload);
    if (!ev) return ctx.response.notFound({ message: "Event not found." });
    return ctx.response.ok(ev);
  }
}
