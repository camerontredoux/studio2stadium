import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { CheckInService, CheckInNotOpenError, NotOnRosterError } from "./service.ts";

export default class CheckInController {
  @inject()
  async handle(ctx: HttpContext, service: CheckInService) {
    const userId = ctx.auth.getUserOrFail().id;
    try {
      const result = await service.execute(ctx.params.id, userId);
      return ctx.response.ok(result);
    } catch (err) {
      if (err instanceof CheckInNotOpenError) {
        return ctx.response.unprocessableEntity({ message: err.message });
      }
      if (err instanceof NotOnRosterError) {
        return ctx.response.forbidden({ message: err.message });
      }
      throw err;
    }
  }
}
