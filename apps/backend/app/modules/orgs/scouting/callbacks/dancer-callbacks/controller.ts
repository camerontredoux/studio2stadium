import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { DancerCallbacksService } from "./service.ts";
import { eventQuerySchema } from "../../event-query-validator.ts";

export default class DancerCallbacksController {
  @inject()
  async handle(ctx: HttpContext, service: DancerCallbacksService) {
    await ctx.request.validateUsing(eventQuerySchema);
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a dancer.",
      });
    }

    const rows = await service.execute(ctx.orgEvent!.id, ctx.orgRoster.id);
    return ctx.response.ok(rows);
  }
}
