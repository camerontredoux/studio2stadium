import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListDancersService } from "./service.ts";
import { EnsureActiveShowcaseService } from "../../showcases/ensure-active/service.ts";
import { schema } from "./validator.ts";
import {
  resolveScoutingViewScope,
  type ScoutingViewScope,
} from "../../view-scope.ts";

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

    let view: ScoutingViewScope | null = null;
    if (payload.eventId) {
      view = await resolveScoutingViewScope(
        ctx.org!.id,
        ctx.auth.user!.id,
        payload.eventId
      );
      if (!view) {
        return ctx.response.unprocessableEntity({
          message: "Selected event does not belong to this organization.",
        });
      }
    } else if (event && ctx.orgRoster) {
      // "All events" collapses each dancer to one row, preferring the active
      // event's, so the marks stay scoped to the active event there.
      const showcase = await ensureShowcase.execute(event.id);
      view = {
        eventId: event.id,
        coachRosterId: ctx.orgRoster.id,
        showcaseId: showcase?.id ?? null,
      };
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
