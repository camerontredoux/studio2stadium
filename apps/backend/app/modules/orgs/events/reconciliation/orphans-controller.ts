import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ReconciliationService } from "./service.ts";
import { orphansSchema } from "./validator.ts";

export default class ListOrphansController {
  @inject()
  async handle(ctx: HttpContext, service: ReconciliationService) {
    const payload = await ctx.request.validateUsing(orphansSchema);
    const result = await service.listOrphans(ctx.params.id, payload);
    return ctx.response.ok(result);
  }
}
