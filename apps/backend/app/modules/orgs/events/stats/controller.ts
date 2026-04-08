import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { EventStatsService } from "./service.ts";

export default class EventStatsController {
  @inject()
  async handle(ctx: HttpContext, service: EventStatsService) {
    const stats = await service.execute(ctx.params.id);
    return ctx.response.ok(stats);
  }
}
