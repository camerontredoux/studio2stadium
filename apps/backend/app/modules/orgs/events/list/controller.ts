import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { ListEventsService } from "./service.ts";
import { orgDefaultTimezone, withEventInstants } from "#utils/event-time";

export default class ListEventsController {
  @inject()
  async handle(ctx: HttpContext, service: ListEventsService) {
    const events = await service.execute(ctx.org!.id);
    const orgDefault = orgDefaultTimezone(ctx.org!.settings);
    return ctx.response.ok(
      events.map((event) => withEventInstants(event, orgDefault))
    );
  }
}
