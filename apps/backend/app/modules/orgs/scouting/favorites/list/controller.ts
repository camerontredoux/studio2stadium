import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListFavoritesService } from "./service.ts";
import { eventQuerySchema } from "../../event-query-validator.ts";
import { resolveScoutingViewScope } from "../../view-scope.ts";

export default class ListFavoritesController {
  @inject()
  async handle(ctx: HttpContext, service: ListFavoritesService) {
    const query = await ctx.request.validateUsing(eventQuerySchema);

    if (query.eventId) {
      const view = await resolveScoutingViewScope(
        ctx.org!.id,
        ctx.auth.user!.id,
        query.eventId
      );
      if (!view) {
        return ctx.response.unprocessableEntity({
          message: "Selected event does not belong to this organization.",
        });
      }
      // A coach who never attended the event simply has no favorites there.
      if (!view.coachRosterId) return ctx.response.ok([]);
      const rows = await service.execute(view.eventId, view.coachRosterId);
      return ctx.response.ok(rows);
    }

    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a coach to scout.",
      });
    }

    const rows = await service.execute(ctx.orgEvent!.id, ctx.orgRoster.id);
    return ctx.response.ok(rows);
  }
}
