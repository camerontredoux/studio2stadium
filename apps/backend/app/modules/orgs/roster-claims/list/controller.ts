import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListRosterClaimsService } from "./service.ts";
import { listClaimsSchema } from "./validator.ts";

export default class ListRosterClaimsController {
  @inject()
  async handle(ctx: HttpContext, service: ListRosterClaimsService) {
    const { status } = await ctx.request.validateUsing(listClaimsSchema);
    const result = await service.execute(ctx.org!.id, status ?? "pending");
    return ctx.response.ok(result);
  }
}
