import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import {
  NotADancerError,
  RosterNotFoundError,
  SetRosterPaidService,
} from "./service.ts";
import { schema } from "./validator.ts";

export default class SetRosterPaidController {
  @inject()
  async handle(ctx: HttpContext, service: SetRosterPaidService) {
    const { paid } = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();
    try {
      const result = await service.execute(
        ctx.params.id,
        ctx.params.rosterId,
        paid,
        { eventId: ctx.params.id, actorId: user.id }
      );
      return ctx.response.ok(result);
    } catch (err) {
      if (err instanceof RosterNotFoundError) {
        return ctx.response.notFound({ code: err.code, message: err.message });
      }
      if (err instanceof NotADancerError) {
        return ctx.response.badRequest({ code: err.code, message: err.message });
      }
      throw err;
    }
  }
}
