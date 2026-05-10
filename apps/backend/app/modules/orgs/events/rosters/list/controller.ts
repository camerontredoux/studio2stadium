import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListRosterService } from "./service.ts";
import { schema } from "./validator.ts";

export default class ListRosterController {
  @inject()
  async handle(ctx: HttpContext, service: ListRosterService) {
    const payload = await ctx.request.validateUsing(schema);
    const result = await service.execute(ctx.params.id, payload);
    return ctx.response.ok(result);
  }
}
