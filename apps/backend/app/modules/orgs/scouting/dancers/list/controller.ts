import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { hasEventStarted } from "#utils/event-time";
import { ListDancersService } from "./service.ts";
import { EnsureActiveShowcaseService } from "../../showcases/ensure-active/service.ts";
import { schema } from "./validator.ts";

export default class ListDancersController {
  @inject()
  async handle(
    ctx: HttpContext,
    service: ListDancersService,
    ensureShowcase: EnsureActiveShowcaseService,
  ) {
    const payload = await ctx.request.validateUsing(schema);
    const event = ctx.orgEvent!;
    const filterCheckedInOnly = hasEventStarted(
      event.startDate,
      event.startTime,
      event.timezone,
    );
    const showcase = await ensureShowcase.execute(event.id);
    const rows = await service.execute(
      event.id,
      ctx.orgRoster?.id ?? null,
      payload,
      filterCheckedInOnly,
      showcase.id,
    );
    return ctx.response.ok(rows);
  }
}
