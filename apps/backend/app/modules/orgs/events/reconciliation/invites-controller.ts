import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ReconciliationService } from "./service.ts";
import { invitesSchema } from "./validator.ts";

export default class ListInvitesController {
  @inject()
  async handle(ctx: HttpContext, service: ReconciliationService) {
    const payload = await ctx.request.validateUsing(invitesSchema);
    const result = await service.listInvites(ctx.params.id, payload);
    return ctx.response.ok(result);
  }
}
