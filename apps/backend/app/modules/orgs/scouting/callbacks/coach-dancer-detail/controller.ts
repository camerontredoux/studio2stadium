import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { DancerCallbackDetailService } from "../dancer-detail/service.ts";

/**
 * A coach's view of a dancer's callbacks: scoped to the coach's own program
 * only. A coach may see that their own program called the dancer back, but
 * never which other programs did.
 */
export default class CoachDancerCallbackDetailController {
  @inject()
  async handle(ctx: HttpContext, service: DancerCallbackDetailService) {
    const dancerRosterId = ctx.params.dancerRosterId as string;

    // With no coach roster in the active event there is nothing of the coach's
    // own to show.
    if (!ctx.orgRoster) {
      return ctx.response.ok([]);
    }

    const rows = await service.execute(
      ctx.org!.id,
      dancerRosterId,
      ctx.orgRoster.id
    );
    return ctx.response.ok(rows);
  }
}
