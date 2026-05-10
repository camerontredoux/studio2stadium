import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { StatsRosterService } from "./service.ts";
import { schema } from "./validator.ts";

export default class StatsRosterController {
  @inject()
  async handle(ctx: HttpContext, service: StatsRosterService) {
    const payload = await ctx.request.validateUsing(schema);
    const result = await service.execute(ctx.params.id, payload);
    return ctx.response.ok(result);
  }
}
