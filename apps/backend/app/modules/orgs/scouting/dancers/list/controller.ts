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
    ensureShowcase: EnsureActiveShowcaseService
  ) {
    const payload = await ctx.request.validateUsing(schema);
    const event = ctx.orgEvent!;

    // Free-tier orgs show every dancer across all of the org's events, and
    // never hide un-checked-in dancers (check-in only applies to the active
    // event, which is meaningless across the full history).
    const features = (ctx.org?.features ?? {}) as Record<string, boolean>;
    const isFreeTier = Boolean(features.freeTierUsers);

    const filterCheckedInOnly = isFreeTier
      ? false
      : hasEventStarted(event.startDate, event.startTime, event.timezone);
    const showcase = await ensureShowcase.execute(event.id);
    const rows = await service.execute(
      event.orgId,
      event.id,
      ctx.orgRoster?.id ?? null,
      payload,
      filterCheckedInOnly,
      showcase.id,
      isFreeTier
    );
    return ctx.response.ok(rows);
  }
}
