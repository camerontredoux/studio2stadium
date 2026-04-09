import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListDancersService } from "./service.ts";
import { schema } from "./validator.ts";

export default class ListDancersController {
  @inject()
  async handle(ctx: HttpContext, service: ListDancersService) {
    const payload = await ctx.request.validateUsing(schema);
    const rows = await service.execute(ctx.orgEvent!.id, payload);
    return ctx.response.ok(rows);
  }
}
