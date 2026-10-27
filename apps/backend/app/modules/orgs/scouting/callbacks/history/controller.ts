import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { CallbackHistoryService } from "./service.ts";

/**
 * The coach's own callbacks on the active event, grouped by showcase: the
 * current showcase's marks and what each published showcase sent for them.
 */
export default class CallbackHistoryController {
  @inject()
  async handle(ctx: HttpContext, service: CallbackHistoryService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a coach to scout.",
      });
    }

    const result = await service.execute(ctx.orgEvent!.id, ctx.orgRoster.id);
    return ctx.response.ok(result);
  }
}
