import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import {
  CoachNoProfileError,
  RosterActiveReadonlyError,
  RosterBibConflictError,
  RosterEmailConflictError,
  RosterNotFoundError,
  UpdateRosterService,
} from "./service.ts";
import { schema } from "./validator.ts";

export default class UpdateRosterController {
  @inject()
  async handle(ctx: HttpContext, service: UpdateRosterService) {
    const payload = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();
    try {
      const result = await service.execute(
        ctx.params.id,
        ctx.params.rosterId,
        payload,
        { eventId: ctx.params.id, actorId: user.id },
      );
      return ctx.response.ok(result);
    } catch (err) {
      if (err instanceof RosterNotFoundError) {
        return ctx.response.notFound({ code: err.code, message: err.message });
      }
      if (err instanceof RosterActiveReadonlyError) {
        return ctx.response.conflict({ code: err.code, message: err.message });
      }
      if (err instanceof RosterEmailConflictError) {
        return ctx.response.conflict({ code: err.code, message: err.message });
      }
      if (err instanceof RosterBibConflictError) {
        return ctx.response.conflict({ code: err.code, message: err.message });
      }
      if (err instanceof CoachNoProfileError) {
        return ctx.response.badRequest({
          code: err.code,
          message: err.message,
        });
      }
      throw err;
    }
  }
}
