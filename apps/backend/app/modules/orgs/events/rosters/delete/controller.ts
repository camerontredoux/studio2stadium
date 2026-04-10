import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { DeleteRosterService } from "./service.ts";
import { schema } from "./validator.ts";

export default class DeleteRosterController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteRosterService) {
    const payload = await ctx.request.validateUsing(schema);
    const result = await service.execute(ctx.params.id, payload);
    return ctx.response.ok(result);
  }
}
