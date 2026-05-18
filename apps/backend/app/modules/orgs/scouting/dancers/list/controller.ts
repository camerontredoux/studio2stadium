import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { hasEventStarted } from "#utils/event-time";
import { ListDancersService } from "./service.ts";
import { schema } from "./validator.ts";

export default class ListDancersController {
  @inject()
  async handle(ctx: HttpContext, service: ListDancersService) {
    const payload = await ctx.request.validateUsing(schema);
    const event = ctx.orgEvent!;
    const filterCheckedInOnly = hasEventStarted(
      event.startDate,
      event.startTime,
      event.timezone,
    );
    const rows = await service.execute(
      event.id,
      ctx.orgRoster?.id ?? null,
      payload,
      filterCheckedInOnly,
    );
    return ctx.response.ok(rows);
  }
}
