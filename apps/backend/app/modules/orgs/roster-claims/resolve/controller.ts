import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import {
  ClaimNotFoundError,
  ClaimRosterMismatchError,
  ResolveRosterClaimService,
} from "./service.ts";
import { resolveClaimSchema } from "./validator.ts";
import {
  DuplicateRosterError,
  RosterNotFoundError,
  UserNotFoundError,
} from "#modules/orgs/events/rosters/attach/service";

export default class ResolveRosterClaimController {
  @inject()
  async handle(ctx: HttpContext, service: ResolveRosterClaimService) {
    const payload = await ctx.request.validateUsing(resolveClaimSchema);
    const user = ctx.auth.getUserOrFail();
    const claimId = ctx.params.claimId;

    try {
      if (payload.action === "reject") {
        return ctx.response.ok(
          await service.reject(ctx.org!.id, claimId, user.id)
        );
      }

      if (!payload.rosterId) {
        return ctx.response.badRequest({
          code: "ROSTER_REQUIRED",
          message: "Choose the roster entry this claim refers to.",
        });
      }

      return ctx.response.ok(
        await service.approve(
          ctx.org!.id,
          claimId,
          payload.rosterId,
          user.id
        )
      );
    } catch (err) {
      if (err instanceof ClaimNotFoundError) {
        return ctx.response.notFound({ code: err.code, message: err.message });
      }
      if (err instanceof RosterNotFoundError) {
        return ctx.response.notFound({ code: err.code, message: err.message });
      }
      if (err instanceof UserNotFoundError) {
        return ctx.response.notFound({ code: err.code, message: err.message });
      }
      if (
        err instanceof ClaimRosterMismatchError ||
        err instanceof DuplicateRosterError
      ) {
        return ctx.response.conflict({
          code: (err as { code: string }).code,
          message: err.message,
        });
      }
      throw err;
    }
  }
}
