import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListDancersService } from "./service.ts";
import { EnsureActiveShowcaseService } from "../../showcases/ensure-active/service.ts";
import { schema } from "./validator.ts";
import { resolveDancerListView } from "../../view-scope.ts";

export default class ListDancersController {
  @inject()
  async handle(
    ctx: HttpContext,
    service: ListDancersService,
    ensureShowcase: EnsureActiveShowcaseService
  ) {
    const payload = await ctx.request.validateUsing(schema);
    const event = ctx.orgEvent;

    // Cross-event browsing never hides unchecked dancers: check-in state only
    // has meaning within the active event, while this endpoint defaults to the
    // organization's complete dancer history.
    const filterCheckedInOnly = false;

    const view = await resolveDancerListView(
      ctx,
      payload.eventId,
      ensureShowcase
    );
    if (view === false) {
      return ctx.response.unprocessableEntity({
        message: "Selected event does not belong to this organization.",
      });
    }

    const rows = await service.execute(
      ctx.org!.id,
      event?.id ?? null,
      view,
      payload,
      filterCheckedInOnly,
      payload.eventId
    );
    return ctx.response.ok(rows);
  }
}
