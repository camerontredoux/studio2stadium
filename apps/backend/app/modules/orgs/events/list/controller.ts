import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { ListEventsService } from "./service.ts";

export default class ListEventsController {
  @inject()
  async handle(ctx: HttpContext, service: ListEventsService) {
    const events = await service.execute(ctx.org!.id);
    return ctx.response.ok(events);
  }
}
