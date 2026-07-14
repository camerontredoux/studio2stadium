import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListSelectionsService } from "./service.ts";
import { eventQuerySchema } from "../../event-query-validator.ts";

export default class ListSelectionsController {
  @inject()
  async handle(ctx: HttpContext, service: ListSelectionsService) {
    await ctx.request.validateUsing(eventQuerySchema);
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event.",
      });
    }
    const rows = await service.execute(ctx.orgEvent!.id, ctx.orgRoster.id);
    return ctx.response.ok(rows);
  }
}
