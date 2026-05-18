import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { AdminCheckInService, RosterNotFoundError } from "./service.ts";

export default class AdminCheckInController {
  @inject()
  async handle(ctx: HttpContext, service: AdminCheckInService) {
    const actorId = ctx.auth.getUserOrFail().id;
    try {
      const result = await service.execute(
        ctx.params.id,
        ctx.params.rosterId,
        actorId,
      );
      return ctx.response.ok(result);
    } catch (err) {
      if (err instanceof RosterNotFoundError) {
        return ctx.response.notFound({ message: err.message });
      }
      throw err;
    }
  }
}
