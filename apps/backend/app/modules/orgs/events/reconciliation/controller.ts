import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ReconciliationService } from "./service.ts";
import { mergeSchema } from "./validator.ts";

export class ListReconciliationController {
  @inject()
  async handle(
    { params, response }: HttpContext,
    service: ReconciliationService
  ) {
    const result = await service.listUnclaimed(params.id);
    return response.ok(result);
  }
}

export class ResendInviteController {
  @inject()
  async handle(
    { params, response }: HttpContext,
    service: ReconciliationService
  ) {
    const result = await service.resendInvite(
      params.inviteId,
      params.id,
      params.slug
    );
    if ("notFound" in result) {
      return response.notFound({ message: "Invite not found." });
    }
    return response.ok({ resent: true });
  }
}

export class RevokeInviteController {
  @inject()
  async handle(
    { params, response }: HttpContext,
    service: ReconciliationService
  ) {
    const result = await service.revokeInvite(params.inviteId, params.id);
    if ("notFound" in result) {
      return response.notFound({ message: "Invite not found." });
    }
    return response.ok({ revoked: true });
  }
}

export class ManualMergeController {
  @inject()
  async handle(
    { request, params, auth, response }: HttpContext,
    service: ReconciliationService
  ) {
    const user = await auth.authenticate();
    const payload = await request.validateUsing(mergeSchema);
    const result = await service.manualMerge(
      params.id,
      params.rosterId,
      payload.targetUserId,
      user.id
    );
    if ("notFound" in result) {
      return response.notFound({
        message: "Roster row not found or already claimed.",
      });
    }
    return response.ok({ merged: true });
  }
}

export class SearchSchoolUsersController {
  @inject()
  async handle(
    { request, response }: HttpContext,
    service: ReconciliationService
  ) {
    const q = request.input("q", "") as string;
    const results = await service.searchSchoolUsers(q);
    return response.ok(results);
  }
}
