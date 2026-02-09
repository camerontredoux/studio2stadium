import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class GetEventsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    // const payload = await ctx.request.validateUsing(validator);

    const events = await service.execute();

    return ctx.response.ok(events);
  }
}
