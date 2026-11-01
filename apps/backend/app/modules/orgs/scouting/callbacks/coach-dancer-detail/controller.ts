import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { DancerCallbackDetailService } from "../dancer-detail/service.ts";
import { eventQuerySchema } from "../../event-query-validator.ts";
import { resolveScoutingViewScope } from "../../view-scope.ts";

/**
 * A coach's view of a dancer's callbacks: scoped to the coach's own program
 * only. A coach may see that their own program called the dancer back, but
 * never which other programs did.
 *
 * A coach holds a separate roster row per event, so a past event is read
 * against the roster re-resolved for that event (via `eventId`); the active
 * event uses the roster on the request context.
 */
export default class CoachDancerCallbackDetailController {
  @inject()
  async handle(ctx: HttpContext, service: DancerCallbackDetailService) {
    const dancerRosterId = ctx.params.dancerRosterId as string;
    const query = await ctx.request.validateUsing(eventQuerySchema);

    let coachRosterId: string | null;
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
      coachRosterId = view.coachRosterId;
    } else {
      coachRosterId = ctx.orgRoster?.id ?? null;
    }

    // No roster for this event means the coach never attended it, so there is
    // nothing of their own to show.
    if (!coachRosterId) {
      return ctx.response.ok([]);
    }

    const rows = await service.execute(
      ctx.org!.id,
      dancerRosterId,
      coachRosterId
    );
    return ctx.response.ok(rows);
  }
}
