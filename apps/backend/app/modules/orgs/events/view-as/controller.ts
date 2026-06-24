import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ViewAsService } from "./service.ts";
import { schema } from "./validator.ts";

export default class ViewAsController {
  @inject()
  async handle(ctx: HttpContext, service: ViewAsService) {
    const payload = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();

    const roster = await service.execute(ctx.orgEvent!.id, user, payload.type);
    return ctx.response.ok(roster);
  }
}
