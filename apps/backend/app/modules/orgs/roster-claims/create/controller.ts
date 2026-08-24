import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { AlreadyOnRosterError, CreateRosterClaimService } from "./service.ts";
import { createClaimSchema } from "./validator.ts";

export default class CreateRosterClaimController {
  @inject()
  async handle(ctx: HttpContext, service: CreateRosterClaimService) {
    const payload = await ctx.request.validateUsing(createClaimSchema);
    const user = ctx.auth.getUserOrFail();

    try {
      const claim = await service.execute(ctx.org!.id, user.id, payload);
      return ctx.response.created(claim);
    } catch (err) {
      if (err instanceof AlreadyOnRosterError) {
        return ctx.response.conflict({ code: err.code, message: err.message });
      }
      throw err;
    }
  }
}
