import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import {
  AccountNotFoundError,
  CreateRosterService,
  EventNotFoundError,
  RosterAccountTakenError,
  RosterBibConflictError,
  RosterEmailConflictError,
  RosterFieldRequiredError,
  RosterRoleConflictError,
} from "./service.ts";
import { schema } from "./validator.ts";

export default class CreateRosterController {
  @inject()
  async handle(ctx: HttpContext, service: CreateRosterService) {
    const payload = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();
    try {
      const result = await service.execute(
        ctx.org!.id,
        ctx.params.id,
        payload,
        {
          eventId: ctx.params.id,
          actorId: user.id,
        }
      );
      return ctx.response.created(result);
    } catch (err) {
      if (err instanceof RosterFieldRequiredError) {
        return ctx.response.unprocessableEntity({
          code: err.code,
          message: err.message,
          field: err.field,
        });
      }
      if (err instanceof RosterRoleConflictError) {
        return ctx.response.unprocessableEntity({
          code: err.code,
          message: err.message,
        });
      }
      if (
        err instanceof EventNotFoundError ||
        err instanceof AccountNotFoundError
      ) {
        return ctx.response.notFound({ code: err.code, message: err.message });
      }
      if (
        err instanceof RosterEmailConflictError ||
        err instanceof RosterAccountTakenError ||
        err instanceof RosterBibConflictError
      ) {
        return ctx.response.conflict({ code: err.code, message: err.message });
      }
      throw err;
    }
  }
}
