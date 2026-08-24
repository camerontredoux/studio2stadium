// apps/backend/app/modules/orgs/events/rosters/attach/controller.ts
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import {
  AttachAccountService,
  DuplicateRosterError,
  RosterAlreadyLinkedError,
  RosterNotFoundError,
  UserNotFoundError,
} from "./service.ts";
import { attachSchema } from "./validator.ts";

export default class AttachAccountController {
  @inject()
  async handle(ctx: HttpContext, service: AttachAccountService) {
    const payload = await ctx.request.validateUsing(attachSchema);
    const user = ctx.auth.getUserOrFail();

    try {
      const result = await service.attach(
        ctx.params.id,
        ctx.params.rosterId,
        payload.targetUserId,
        user.id,
        payload.confirmRelink ?? false
      );
      return ctx.response.ok(result);
    } catch (err) {
      if (err instanceof RosterAlreadyLinkedError) {
        // 409 with the displaced account attached, so the client can name who
        // is being reassigned instead of asking a blind "are you sure?".
        return ctx.response.conflict({
          code: err.code,
          message: err.message,
          currentUser: err.currentUser,
        });
      }
      if (err instanceof RosterNotFoundError) {
        return ctx.response.notFound({ code: err.code, message: err.message });
      }
      if (err instanceof UserNotFoundError) {
        return ctx.response.notFound({ code: err.code, message: err.message });
      }
      if (err instanceof DuplicateRosterError) {
        return ctx.response.conflict({ code: err.code, message: err.message });
      }
      throw err;
    }
  }
}
