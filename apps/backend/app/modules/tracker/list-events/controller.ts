import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { ListTrackerEventsService } from "./service.ts";
import { schema } from "./validator.ts";

export default class ListTrackerEventsController {
  @inject()
  async handle(ctx: HttpContext, service: ListTrackerEventsService) {
    const filters = await ctx.request.validateUsing(schema);
    const events = await service.execute(filters);

    return ctx.response.ok(events);
  }
}
