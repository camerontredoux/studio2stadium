import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { GetDancerByIdService } from "./service.ts";
import { eventQuerySchema } from "../../event-query-validator.ts";
import {
  findActiveShowcaseId,
  resolveScoutingViewScope,
  type ScoutingViewScope,
} from "../../view-scope.ts";

export default class GetDancerByIdController {
  @inject()
  async handle(ctx: HttpContext, service: GetDancerByIdService) {
    const rosterId = ctx.params.rosterId as string;
    const query = await ctx.request.validateUsing(eventQuerySchema);

    let view: ScoutingViewScope | null = null;
    if (query.eventId) {
      view = await resolveScoutingViewScope(
        ctx.org!.id,
        ctx.auth.user!.id,
        query.eventId
      );
      if (!view) {
        return ctx.response.unprocessableEntity({
          message: "Selected event does not belong to this organization.",
        });
      }
    } else if (ctx.orgEvent && ctx.orgRoster) {
      view = {
        eventId: ctx.orgEvent.id,
        coachRosterId: ctx.orgRoster.id,
        showcaseId: await findActiveShowcaseId(ctx.orgEvent.id),
      };
    }

    const result = await service.execute(
      ctx.org!.id,
      rosterId,
      view,
      Boolean(query.eventId)
    );
    if (!result) return ctx.response.notFound({ message: "Dancer not found." });
    return ctx.response.ok(result);
  }
}
