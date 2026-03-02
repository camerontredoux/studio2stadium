import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

export default class GetEventsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const session = ctx.auth.getUserOrFail();
    const filters = await ctx.request.validateUsing(validator);
    const events = await service.execute(session.id, filters);

    return ctx.response.ok(events);
  }
}
