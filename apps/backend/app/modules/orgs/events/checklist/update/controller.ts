import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { UpdateChecklistService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpdateChecklistController {
  @inject()
  async handle(ctx: HttpContext, service: UpdateChecklistService) {
    const payload = await ctx.request.validateUsing(schema);
    const result = await service.execute(ctx.params.id, ctx.params.itemId, payload);
    return ctx.response.ok(result);
  }
}
